import styles from "./styles/ActivateAccount.module.scss";
import DefaultProfile from "../../media/defaultProfile.webp";
const Activate = () => {
  return (
    <div className={styles.activateFormContainer}>
      <div className={styles.profileForm}>
        <h2>Verify Email and Set Profile</h2>
        <form>
          <div className={styles.profileImage}>
            <input type="file" />
            <span className={styles.selectProfile}>Select Profile</span>
            <img src={DefaultProfile} alt="" />
          </div>
          <div className={styles.columnContainer}>
            <div className={styles.inputContainers}>
              <label>First Name:</label>
              <input type="text" />
            </div>
            <div className={styles.inputContainers}>
              <label>Last Name:</label>
              <input type="text" />
            </div>
          </div>
          <div className={styles.columnContainer}>
            <div className={styles.inputContainers}>
              <label>Address:</label>
              <input type="text" />
            </div>
          </div>
          <div className={styles.columnContainer}>
            <div className={styles.inputContainers}>
              <label>Birthdate:</label>
              <input type="date" />
            </div>
            <div className={styles.inputContainers}>
              <label>Gender:</label>
              <select>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className={styles.columnContainer}>
            <div className={styles.inputContainers}>
              <label>Contact No.:</label>
              <input type="text" />
            </div>
          </div>
          <div className={styles.columnContainer}>
            <div className={styles.inputContainers}>
              <label>Bio:</label>
              <textarea></textarea>
            </div>
          </div>
          <button>Submit</button>
        </form>
      </div>
    </div>
  );
};
export default Activate;
