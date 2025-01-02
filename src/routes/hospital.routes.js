
import { Router } from 'express';
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.hospital.middleware.js";
import { verifyJWT as verifyUser } from "../middleware/auth.middleware.js";
import {
  registerHospital,
  loginHospital,
  logoutHospital,
  refreshAccessToken,
  getCurrentHospital,
  updateHospitalProfile,
  uploadOtherPhotos,
  deletePhotos,
  getAllHospitals,
  getHospitalsByName,
  getHospitalById,
  addPatient,
} from "../controllers/hospital.controller.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profilephoto",
      maxCount: 1,
    },
  ]),
  registerHospital
);

router.route("/login").post(loginHospital);
router.route("/logout").post(verifyJWT, logoutHospital);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-hospital").post(verifyJWT, getCurrentHospital);
router.route("/all").get(getAllHospitals);
router.route("/search/:name").get(getHospitalsByName);
router.route("/:hospitalId").get(getHospitalById);

router
  .route("/update-profile")
  .post(verifyJWT, upload.single("profilephoto"), updateHospitalProfile);

router
  .route("/upload-photos")
  .post(verifyJWT, upload.array("photos", 10), uploadOtherPhotos);

router.route("/delete-photos").post(verifyJWT, deletePhotos);

router.route("/:search")

router.route("/add-patient").post(verifyUser, addPatient);


export default router;