// =====================================
// LOGOUT
// =====================================

function logout() {

    // Show custom logout confirmation modal
    document.getElementById("logoutModal").style.display = "flex";

    // Stop background scrolling
    document.body.style.overflow = "hidden";

}



// =====================================
// CLOSE LOGOUT MODAL
// =====================================

function closeLogoutModal() {

    document.getElementById("logoutModal").style.display = "none";

    // Enable scrolling
    document.body.style.overflow = "auto";

}



// =====================================
// CONFIRM LOGOUT
// =====================================

function confirmLogout() {

    window.location.href = "login.html";

}



// =====================================
// SUBMIT EXPERT REPORT
// =====================================

function submitExpertReport() {


    // =================================
    // GET VALUES
    // =================================

    let severity =
        document.getElementById("severity").value;


    let cropCondition =
        document.getElementById("cropCondition").value;


    let spreadRisk =
        document.getElementById("spreadRisk").value;


    let observation =
        document.getElementById("observation").value;


    let management =
        document.getElementById("management").value;


    let followup =
        document.getElementById("followup").value;



    // =================================
    // CHECK EMPTY FIELDS
    // =================================

    let missingFields = [];


    if (severity === "") {

        missingFields.push(
            "• Disease Severity"
        );

    }


    if (cropCondition === "") {

        missingFields.push(
            "• Crop Condition"
        );

    }


    if (spreadRisk === "") {

        missingFields.push(
            "• Disease Spread Risk"
        );

    }


    if (observation.trim() === "") {

        missingFields.push(
            "• Expert Observation"
        );

    }


    if (management.trim() === "") {

        missingFields.push(
            "• Crop Management Advice"
        );

    }


    if (followup.trim() === "") {

        missingFields.push(
            "• Follow-up Advice"
        );

    }



    // =================================
    // IF ANY FIELD IS EMPTY
    // =================================

    if (missingFields.length > 0) {


        // Show missing fields

        document.getElementById(
            "missingFields"
        ).innerHTML =
            missingFields.join("<br>");


        // Show warning popup

        document.getElementById(
            "warningModal"
        ).style.display = "flex";


        // Stop background scrolling

        document.body.style.overflow =
            "hidden";


        return;

    }



    // =================================
    // ALL FIELDS ARE COMPLETE
    // SHOW CONFIRMATION
    // =================================

    document.getElementById(
        "confirmModal"
    ).style.display = "flex";


    // Stop background scrolling

    document.body.style.overflow =
        "hidden";

}



// =====================================
// CLOSE WARNING MODAL
// =====================================

function closeWarningModal() {

    document.getElementById(
        "warningModal"
    ).style.display = "none";


    document.body.style.overflow =
        "auto";

}



// =====================================
// CLOSE CONFIRMATION MODAL
// =====================================

function closeConfirmModal() {

    document.getElementById(
        "confirmModal"
    ).style.display = "none";


    document.body.style.overflow =
        "auto";

}



// =====================================
// CONFIRM SUBMISSION
// =====================================

function confirmSubmission() {


    // =================================
    // CLOSE CONFIRMATION
    // =================================

    document.getElementById(
        "confirmModal"
    ).style.display = "none";



    // =================================
    // SHOW SUCCESS MODAL
    // =================================

    document.getElementById(
        "successModal"
    ).style.display = "flex";


    // Keep background locked

    document.body.style.overflow =
        "hidden";



    // =================================
    // AUTOMATICALLY CLOSE SUCCESS
    // =================================

    setTimeout(function () {

        closeSuccessModal();

    }, 2500);

}



// =====================================
// CLOSE SUCCESS MODAL
// =====================================

function closeSuccessModal() {

    document.getElementById(
        "successModal"
    ).style.display = "none";


    // Enable scrolling

    document.body.style.overflow =
        "auto";

}