import User from '../models/User.js';

export async function getTeamMembers(req, res, next) {
  try {
    const members = await User.find().select('-password').sort({ createdAt: 1 });
    res.json(members);
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(req, res, next) {
  try {
    const { name, email, role = 'viewer', password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Default password for invited members (they should change it)
    const user = await User.create({
      name,
      email,
      password: password || 'changeme123',
      role,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Team member removed' });
  } catch (error) {
    next(error);
  }
}
