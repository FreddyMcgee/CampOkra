const SUPABASE_URL =
    "https://zpieybsuenfflnrczqsp.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_7TG5s2pIWFdM38TZqkijkw_rUjEvmLh";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

const registrationForm =
    document.getElementById("registrationForm");

registrationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const registration = {

            parent_name:
                document.getElementById("parentName").value,

            email:
                document.getElementById("email").value,

            phone:
                document.getElementById("phone").value,

            camper_first_name:
                document.getElementById("camperFirstName").value,

            camper_last_name:
                document.getElementById("camperLastName").value,

            camper_age:
                parseInt(
                    document.getElementById("camperAge").value
                ),

            emergency_contact:
                document.getElementById("emergencyContact").value,

            emergency_phone:
                document.getElementById("emergencyPhone").value,

            allergies:
                document.getElementById("allergies").value,

            photo_release:
                document.getElementById("photoRelease").checked,

            waiver_agreed:
                document.getElementById("waiver").checked
        };

        const { error } =
            await supabaseClient
                .from("registrations")
                .insert([registration]);

        if (error) {

            console.error(error);

            alert(
                "There was a problem submitting your registration."
            );

            return;
        }

        alert(
            "Registration submitted successfully!"
        );

        registrationForm.reset();
    }
);