import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Member from '../models/Member.js';
import { protect } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

// GET all members (scoped to user)
router.get('/', protect, async (req, res) => {
  try {
    const members = await Member.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single member
router.get('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create member
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, rollNumber, year, degree, email, role, project, hobbies, certificate, internship, aboutYourAim } = req.body;
    if (!name || !rollNumber || !year || !degree || !email || !role) {
      return res.status(400).json({ error: 'Required fields: name, rollNumber, year, degree, email, role' });
    }
    const member = await Member.create({
      name, rollNumber, year, degree, email, role,
      project: project || '',
      hobbies: hobbies || '',
      certificate: certificate || '',
      internship: internship || '',
      aboutYourAim: aboutYourAim || '',
      image: req.file ? req.file.filename : '',
      createdBy: req.user._id,
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
router.delete('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
