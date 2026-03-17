const { User, Friendship } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const OTP_TTL_MINUTES = parseInt(process.env.PASSWORD_OTP_TTL_MINUTES, 10) || 10;
const OTP_MIN_REQUEST_GAP_SEC = parseInt(process.env.PASSWORD_OTP_MIN_GAP_SEC, 10) || 60;
const OTP_MAX_ATTEMPTS = parseInt(process.env.PASSWORD_OTP_MAX_ATTEMPTS, 10) || 5;
const OTP_BLOCK_MINUTES = parseInt(process.env.PASSWORD_OTP_BLOCK_MINUTES, 10) || 15;

const getMissingSmtpEnv = () => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  return required.filter((key) => !process.env[key]);
};

const createTransport = () => {
  if (getMissingSmtpEnv().length > 0) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: String(process.env.SMTP_PORT) === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const hashOtp = (code) => crypto.createHash('sha256').update(code).digest('hex');
const getSecondsDiff = (future, now = new Date()) => Math.max(0, Math.ceil((future - now) / 1000));

const attachFriendshipStatus = async (currentUserId, users) => {
  return Promise.all(
    users.map(async (u) => {
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { requesterId: currentUserId, receiverId: u.id },
            { requesterId: u.id, receiverId: currentUserId },
          ],
        },
      });
      return {
        ...u.toJSON(),
        friendshipStatus: friendship ? friendship.status : null,
        friendshipId: friendship ? friendship.id : null,
        isRequester: friendship ? friendship.requesterId === currentUserId : null,
      };
    })
  );
};

// @desc  List all users (optionally filtered by query)
// @route GET /api/users
exports.listUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const filters = [{ id: { [Op.ne]: req.user.id } }];

    if (q && q.trim().length >= 2) {
      filters.push({
        [Op.or]: [
          { username: { [Op.like]: `%${q}%` } },
          { fullName: { [Op.like]: `%${q}%` } },
        ],
      });
    }

    const users = await User.findAll({
      where: { [Op.and]: filters },
      attributes: ['id', 'username', 'fullName', 'avatar', 'bio', 'isOnline', 'lastSeen'],
      order: [['fullName', 'ASC']],
    });

    const withStatus = await attachFriendshipStatus(req.user.id, users);
    res.json({ users: withStatus });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Search users
// @route GET /api/users/search?q=...
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    const users = await User.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: req.user.id } },
          {
            [Op.or]: [
              { username: { [Op.like]: `%${q}%` } },
              { fullName: { [Op.like]: `%${q}%` } },
            ],
          },
        ],
      },
      attributes: ['id', 'username', 'fullName', 'avatar', 'bio', 'isOnline', 'lastSeen'],
      limit: 20,
    });

    const withStatus = await attachFriendshipStatus(req.user.id, users);
    res.json({ users: withStatus });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get user profile
// @route GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'fullName', 'avatar', 'bio', 'isOnline', 'lastSeen'],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update profile
// @route PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    await User.update(updates, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update avatar
// @route PUT /api/users/avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByPk(req.user.id);
    // Delete old avatar
    if (user.avatar) {
      const safeRelative = user.avatar.replace(/^\/+/, '');
      const oldPath = path.join(__dirname, '..', safeRelative);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatar: avatarUrl });
    res.json({ message: 'Avatar updated', avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Request OTP for password change
// @route POST /api/users/password/otp
exports.requestPasswordOtp = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const missingSmtpEnv = getMissingSmtpEnv();
    if (missingSmtpEnv.length > 0) {
      return res.status(500).json({
        message: `Email service is not configured. Missing: ${missingSmtpEnv.join(', ')}`,
      });
    }

    const now = new Date();

    if (user.passwordOtpBlockedUntil && user.passwordOtpBlockedUntil > now) {
      const retryAfterSec = getSecondsDiff(user.passwordOtpBlockedUntil, now);
      return res.status(429).json({
        message: `Too many invalid OTP attempts. Try again in ${retryAfterSec} seconds.`,
        retryAfterSec,
      });
    }

    if (user.passwordOtpRequestedAt) {
      const diffSec = Math.floor((now - user.passwordOtpRequestedAt) / 1000);
      if (diffSec < OTP_MIN_REQUEST_GAP_SEC) {
        const retryAfterSec = OTP_MIN_REQUEST_GAP_SEC - diffSec;
        return res.status(429).json({
          message: `Please wait ${retryAfterSec} seconds before requesting another OTP.`,
          retryAfterSec,
        });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

    await user.update({
      passwordOtpHash: hashOtp(code),
      passwordOtpExpires: expires,
      passwordOtpRequestedAt: now,
      passwordOtpAttempts: 0,
      passwordOtpBlockedUntil: null,
    });

    const transport = createTransport();
    if (!transport) {
      return res.status(500).json({ message: 'Email service is unavailable. Please contact support.' });
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transport.sendMail({
      from,
      to: user.email,
      subject: 'Your ChatApp password change OTP',
      text: ` Welcome to ChatApp, ${user.fullName}!\n\n,
              Your OTP is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.
              If you did not request this, please ignore this email and consider changing your password.
              Thank you for using ChatApp!`,
      html: `
        <div style="margin:0;padding:24px;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e5e7eb;">
            <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Password Change Verification</h2>
            <p style="margin:0 0 16px;line-height:1.6;color:#374151;">Use the OTP below to confirm your password change request.</p>
            <div style="margin:0 0 16px;padding:14px 18px;background:#eef6ff;border:1px solid #cfe4ff;border-radius:10px;text-align:center;">
              <span style="font-size:28px;letter-spacing:6px;font-weight:700;color:#0f172a;">${code}</span>
            </div>
            <p style="margin:0 0 10px;line-height:1.6;color:#374151;">This OTP will expire in <strong>${OTP_TTL_MINUTES} minutes</strong>.</p>
            <p style="margin:0;line-height:1.6;color:#6b7280;font-size:13px;">If you did not request this, please ignore this email and consider changing your password.</p>
          </div>
        </div>
      `,
    });

    res.json({ message: 'OTP sent to your email', retryAfterSec: OTP_MIN_REQUEST_GAP_SEC });
  } catch (error) {
    console.error('Request OTP error:', error);
    const msg = error?.message ? `Could not send OTP email: ${error.message}` : 'Could not send OTP email';
    res.status(500).json({ message: msg });
  }
};

// @desc  Change password
// @route PUT /api/users/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    const user = await User.findByPk(req.user.id);
    const now = new Date();

    if (user.passwordOtpBlockedUntil && user.passwordOtpBlockedUntil > now) {
      const retryAfterSec = getSecondsDiff(user.passwordOtpBlockedUntil, now);
      return res.status(429).json({
        message: `Too many invalid OTP attempts. Try again in ${retryAfterSec} seconds.`,
        retryAfterSec,
      });
    }

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    if (!user.passwordOtpHash || !user.passwordOtpExpires) {
      return res.status(400).json({ message: 'OTP not requested or expired' });
    }
    if (user.passwordOtpExpires < now) {
      await user.update({
        passwordOtpHash: null,
        passwordOtpExpires: null,
        passwordOtpRequestedAt: null,
        passwordOtpAttempts: 0,
      });
      return res.status(400).json({ message: 'OTP has expired' });
    }
    const otpHash = hashOtp(String(otp));
    if (otpHash !== user.passwordOtpHash) {
      const attempts = (user.passwordOtpAttempts || 0) + 1;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        const blockedUntil = new Date(now.getTime() + OTP_BLOCK_MINUTES * 60 * 1000);
        await user.update({
          passwordOtpAttempts: attempts,
          passwordOtpBlockedUntil: blockedUntil,
          passwordOtpHash: null,
          passwordOtpExpires: null,
          passwordOtpRequestedAt: null,
        });
        const retryAfterSec = getSecondsDiff(blockedUntil, now);
        return res.status(429).json({
          message: `Too many invalid OTP attempts. Try again in ${retryAfterSec} seconds.`,
          retryAfterSec,
        });
      }

      await user.update({ passwordOtpAttempts: attempts });
      return res.status(400).json({
        message: `Invalid OTP. ${OTP_MAX_ATTEMPTS - attempts} attempt(s) left before temporary lock.`,
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    await user.update({ password: newPassword });
    await user.update({
      passwordOtpHash: null,
      passwordOtpExpires: null,
      passwordOtpRequestedAt: null,
      passwordOtpAttempts: 0,
      passwordOtpBlockedUntil: null,
    });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
