import Settings from '../models/Settings.js';
import { generateApiKey, maskApiKey } from '../utils/helpers.js';

// Get or create singleton settings
async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    const prodKey = generateApiKey('sk_live');
    const devKey = generateApiKey('sk_test');
    settings = await Settings.create({
      apiKeys: [
        { key: prodKey, type: 'production' },
        { key: devKey, type: 'development' },
      ],
    });
  }
  return settings;
}

export async function getSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();

    // Mask API keys for response
    const masked = settings.toJSON();
    masked.apiKeys = masked.apiKeys.map(k => ({
      ...k,
      maskedKey: maskApiKey(k.key),
    }));

    res.json(masked);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    const { webhooks, notifications, organizationName } = req.body;

    if (webhooks) settings.webhooks = { ...settings.webhooks.toObject(), ...webhooks };
    if (notifications) settings.notifications = { ...settings.notifications.toObject(), ...notifications };
    if (organizationName) settings.organizationName = organizationName;

    await settings.save();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function getApiKeys(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    const keys = settings.apiKeys.map(k => ({
      id: k._id,
      type: k.type,
      maskedKey: maskApiKey(k.key),
      isActive: k.isActive,
      createdAt: k.createdAt,
    }));
    res.json(keys);
  } catch (error) {
    next(error);
  }
}

export async function revealApiKey(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    const apiKey = settings.apiKeys.id(req.params.keyId);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json({ key: apiKey.key, type: apiKey.type });
  } catch (error) {
    next(error);
  }
}

export async function generateNewApiKey(req, res, next) {
  try {
    const { type = 'development' } = req.body;
    const settings = await getOrCreateSettings();

    const prefix = type === 'production' ? 'sk_live' : 'sk_test';
    const newKey = generateApiKey(prefix);

    settings.apiKeys.push({ key: newKey, type });
    await settings.save();

    res.status(201).json({
      key: newKey,
      maskedKey: maskApiKey(newKey),
      type,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeApiKey(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    const apiKey = settings.apiKeys.id(req.params.keyId);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    apiKey.isActive = false;
    await settings.save();
    res.json({ message: 'API key revoked' });
  } catch (error) {
    next(error);
  }
}
