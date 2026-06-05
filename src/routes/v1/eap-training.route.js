import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as eapTrainingValidation from '../../validations/eap-training.validation.js';
import * as eapTrainingController from '../../controllers/eap-training.controller.js';

const router = express.Router();

router.get(
  '/mine',
  auth(),
  eapTrainingController.listMine
);

router
  .route('/')
  .get(auth(), validate(eapTrainingValidation.listEapTrainings), eapTrainingController.listEapTrainings)
  .post(auth(), validate(eapTrainingValidation.createEapTraining), eapTrainingController.createEapTraining);

router
  .route('/:id')
  .get(auth(), validate(eapTrainingValidation.eapTrainingId), eapTrainingController.getEapTraining)
  .patch(auth(), validate(eapTrainingValidation.updateEapTraining), eapTrainingController.updateEapTraining)
  .delete(auth(), validate(eapTrainingValidation.eapTrainingId), eapTrainingController.deleteEapTraining);

export default router;
