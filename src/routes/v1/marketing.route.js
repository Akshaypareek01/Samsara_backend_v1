import express from 'express';
import multer from 'multer';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import validate from '../../middlewares/validate.js';
import * as marketingValidation from '../../validations/marketing.validation.js';
import * as marketingController from '../../controllers/marketing.controller.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — CSV/XLSX imports
});

router.use(auth(), adminOnly());

// Contacts
router.post('/contacts', validate(marketingValidation.createContact), marketingController.createContact);
router.get('/contacts', validate(marketingValidation.getContacts), marketingController.getContacts);
router.get('/contacts/export', validate(marketingValidation.exportContacts), marketingController.exportContacts);
router.get('/contacts/import-template', marketingController.downloadImportTemplate);
router.post('/contacts/import', upload.single('file'), marketingController.importContacts);
router.get('/contacts/:id', validate(marketingValidation.contactIdParam), marketingController.getContact);
router.patch('/contacts/:id', validate(marketingValidation.updateContact), marketingController.updateContact);
router.delete('/contacts/:id', validate(marketingValidation.contactIdParam), marketingController.deleteContact);

// Folders (client lists / segments)
router.post('/folders', validate(marketingValidation.createFolder), marketingController.createFolder);
router.get('/folders', validate(marketingValidation.getFolders), marketingController.getFolders);
router.patch('/folders/:id', validate(marketingValidation.updateFolder), marketingController.updateFolder);
router.delete('/folders/:id', validate(marketingValidation.folderIdParam), marketingController.deleteFolder);

// Email templates
router.post('/templates', validate(marketingValidation.createTemplate), marketingController.createTemplate);
router.get('/templates', validate(marketingValidation.getTemplates), marketingController.getTemplates);
router.patch('/templates/:id', validate(marketingValidation.updateTemplate), marketingController.updateTemplate);
router.delete('/templates/:id', validate(marketingValidation.templateIdParam), marketingController.deleteTemplate);

// Email campaigns
router.post('/campaigns', validate(marketingValidation.createCampaign), marketingController.createCampaign);
router.get('/campaigns', validate(marketingValidation.getCampaigns), marketingController.getCampaigns);
router.patch('/campaigns/:id', validate(marketingValidation.updateCampaign), marketingController.updateCampaign);
router.delete('/campaigns/:id', validate(marketingValidation.campaignIdParam), marketingController.deleteCampaign);
router.post('/campaigns/:id/send', validate(marketingValidation.campaignIdParam), marketingController.sendCampaign);

export default router;
