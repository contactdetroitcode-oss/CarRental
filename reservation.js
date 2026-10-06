const CARS_KEY="carRentalCars";
const RESERVATIONS_KEY="carRentalReservations";

const carPreview=document.getElementById("carPreview");
const reservationForm=document.getElementById("reservationForm");

const fullNameInput=document.getElementById("fullName");
const emailInput=document.getElementById("email");
const phoneInput=document.getElementById("phone");
const startDateInput=document.getElementById("startDate");
const endDateInput=document.getElementById("endDate");

const dailyPriceElement=document.getElementById("dailyPrice");
const durationElement=document.getElementById("duration");
const totalPriceElement=document.getElementById("totalPrice");

const formError=document.getElementById("formError");
const confirmButton=document.getElementById("confirmButton");

const reservationsList=document.getElementById("reservationsList");
const emptyReservations=document.getElementById("emptyReservations");

const successModal=document.getElementById("successModal");
const closeSuccessModal=document.getElementById("closeSuccessModal");
const successReservationNumber=document.getElementById("successReservationNumber");
const viewReservationsButton=document.getElementById("viewReservationsButton");

const toast=document.getElementById("toast");
const toastIcon=document.getElementById("toastIcon");
const toastMessage=document.getElementById("toastMessage");

const urlParams=new URLSearchParams(window.location.search);
const carId=urlParams.get("id");

let currentCar=null;

function escapeHTML(value){
    if(value===null||value===undefined)return"";

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function formatPrice(price){
    return Number(price||0).toLocaleString("fr-FR")+" DH";
}

function formatCategory(category){
    const categories={
        economique:"Économique",
        berline:"Berline",
        luxe:"Luxe",
        suv:"SUV",
        citadine:"Citadine",
        familiale:"Familiale"
    };

    return categories[category]||category||"Voiture";
}

function getCars(){
    try{
        const cars=JSON.parse(
            localStorage.getItem(CARS_KEY)
        );

        return Array.isArray(cars)?cars:[];
    }catch(error){
        console.error(error);
        return[];
    }
}

function getReservations(){
    try{
        const reservations=JSON.parse(
            localStorage.getItem(RESERVATIONS_KEY)
        );

        return Array.isArray(reservations)
            ?reservations
            :[];
    }catch(error){
        console.error(error);
        return[];
    }
}

function saveReservations(reservations){
    try{
        localStorage.setItem(
            RESERVATIONS_KEY,
            JSON.stringify(reservations)
        );

        return true;
    }catch(error){
        console.error(error);
        return false;
    }
}

function getTodayString(){
    const today=new Date();

    const year=today.getFullYear();
    const month=String(
        today.getMonth()+1
    ).padStart(2,"0");

    const day=String(
        today.getDate()
    ).padStart(2,"0");

    return`${year}-${month}-${day}`;
}

function formatDate(dateString){
    if(!dateString)return"-";

    const parts=dateString.split("-");

    if(parts.length!==3)return dateString;

    return`${parts[2]}/${parts[1]}/${parts[0]}`;
}

function isValidDateString(dateString){
    return/^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

function dateToNumber(dateString){
    if(!isValidDateString(dateString))return 0;

    const parts=dateString.split("-").map(Number);

    return(
        parts[0]*10000+
        parts[1]*100+
        parts[2]
    );
}

function calculateDuration(){
    if(
        !startDateInput||
        !endDateInput||
        !startDateInput.value||
        !endDateInput.value
    ){
        return 0;
    }

    const start=startDateInput.value.split("-").map(Number);
    const end=endDateInput.value.split("-").map(Number);

    if(start.length!==3||end.length!==3)return 0;

    const startUTC=Date.UTC(
        start[0],
        start[1]-1,
        start[2]
    );

    const endUTC=Date.UTC(
        end[0],
        end[1]-1,
        end[2]
    );

    const difference=endUTC-startUTC;

    if(difference<=0)return 0;

    return Math.round(
        difference/(1000*60*60*24)
    );
}

function showToast(message,type="success"){
    if(!toast||!toastMessage){
        alert(message);
        return;
    }

    toastMessage.textContent=message;

    if(toastIcon){
        toastIcon.textContent=
            type==="error"?"✕":"✓";
    }

    toast.classList.add("show");

    setTimeout(()=>{
        toast.classList.remove("show");
    },3500);
}

function showFormError(message){
    if(!formError){
        alert(message);
        return;
    }

    formError.textContent=message;
    formError.classList.add("show");
}

function hideFormError(){
    if(!formError)return;

    formError.textContent="";
    formError.classList.remove("show");
}

function isValidEmail(email){
    return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone){
    const cleaned=phone.replace(/\s+/g,"");

    return/^(\+212|0)([5-7])\d{8}$/.test(cleaned);
}

function findCurrentCar(){
    const cars=getCars();

    if(!carId){
        console.warn("Aucun ID de voiture.");
        return null;
    }

    return cars.find(
        car=>String(car.id)===String(carId)
    );
}

function displayCarPreview(){
    if(!carPreview)return;

    if(!currentCar){

        carPreview.innerHTML=`
            <div class="car-preview-error">
                <div class="error-icon">⚠️</div>
                <h3>Voiture introuvable</h3>
                <p>
                    La voiture sélectionnée n'existe pas
                    ou n'est plus disponible.
                </p>
                <a href="index.html" class="cancel-button">
                    Retour aux voitures
                </a>
            </div>
        `;

        if(confirmButton){
            confirmButton.disabled=true;
        }

        return;
    }

    if(confirmButton){
        confirmButton.disabled=false;
    }

    const image=currentCar.image||"images/golf.jpg";

    carPreview.innerHTML=`
        <div class="car-preview-image">
            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(currentCar.name)}"
                onerror="this.src='images/golf.jpg'"
            >
        </div>

        <div class="car-preview-content">

            <span class="car-category">
                ${escapeHTML(
                    formatCategory(currentCar.category)
                )}
            </span>

            <h2>
                ${escapeHTML(currentCar.name)}
            </h2>

            <div class="car-preview-meta">

                <span>
                    📅 ${escapeHTML(currentCar.year||"-")}
                </span>

                <span>
                    ⚙️ ${escapeHTML(currentCar.transmission||"-")}
                </span>

                <span>
                    ⛽ ${escapeHTML(currentCar.fuel||"-")}
                </span>

                <span>
                    👥 ${escapeHTML(currentCar.seats||"-")} places
                </span>

            </div>

            <div class="car-preview-price">

                <strong>
                    ${formatPrice(currentCar.price)}
                </strong>

                <span>
                    / jour
                </span>

            </div>

        </div>
    `;

    if(dailyPriceElement){
        dailyPriceElement.textContent=
            formatPrice(currentCar.price);
    }

    updatePrice();
}

function updatePrice(){
    if(!currentCar)return;

    const duration=calculateDuration();
    const dailyPrice=Number(currentCar.price)||0;
    const total=duration*dailyPrice;

    if(durationElement){
        durationElement.textContent=
            duration>0
                ?`${duration} jour${duration>1?"s":""}`
                :"0 jour";
    }

    if(totalPriceElement){
        totalPriceElement.textContent=
            formatPrice(total);
    }
}

function hasDateConflict(
    carIdValue,
    startDate,
    endDate
){
    const reservations=getReservations();

    return reservations.some(reservation=>{

        if(
            String(reservation.carId)!==
            String(carIdValue)
        ){
            return false;
        }

        if(reservation.status==="Annulée"){
            return false;
        }

        const existingStart=reservation.startDate;
        const existingEnd=reservation.endDate;

        return(
            startDate<existingEnd&&
            endDate>existingStart
        );
    });
}

function generateReservationNumber(){
    return`CR-${Math.floor(
        100000+Math.random()*900000
    )}`;
}

function getReservationStatus(reservation){

    if(reservation.status==="Annulée"){
        return"Annulée";
    }

    const today=getTodayString();

    if(reservation.endDate<today){
        return"Terminée";
    }

    if(reservation.startDate>today){
        return"À venir";
    }

    return"En cours";
}

function getStatusClass(status){

    if(status==="En cours"){
        return"status-active";
    }

    if(status==="Terminée"){
        return"status-finished";
    }

    if(status==="Annulée"){
        return"status-cancelled";
    }

    return"status-upcoming";
}

function createReservationCard(reservation){

    const status=getReservationStatus(reservation);
    const statusClass=getStatusClass(status);
    const image=reservation.carImage||"images/golf.jpg";

    return`
        <article class="reservation-card">

            <div class="reservation-car-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(reservation.carName)}"
                    onerror="this.src='images/golf.jpg'"
                >

                <span class="reservation-status ${statusClass}">
                    ${escapeHTML(status)}
                </span>

            </div>

            <div class="reservation-card-content">

                <div class="reservation-card-top">

                    <div>

                        <span class="reservation-number">
                            ${escapeHTML(
                                reservation.reservationNumber
                            )}
                        </span>

                        <h3>
                            ${escapeHTML(
                                reservation.carName
                            )}
                        </h3>

                        <p class="reservation-category">
                            ${escapeHTML(
                                formatCategory(
                                    reservation.category
                                )
                            )}
                        </p>

                    </div>

                    <div class="reservation-price">

                        <strong>
                            ${formatPrice(
                                reservation.totalPrice
                            )}
                        </strong>

                        <span>
                            Total
                        </span>

                    </div>

                </div>


                <div class="reservation-dates">

                    <div class="reservation-date-box">

                        <span class="date-label">
                            DÉPART
                        </span>

                        <strong>
                            ${formatDate(
                                reservation.startDate
                            )}
                        </strong>

                    </div>

                    <div class="date-arrow">
                        →
                    </div>

                    <div class="reservation-date-box">

                        <span class="date-label">
                            RETOUR
                        </span>

                        <strong>
                            ${formatDate(
                                reservation.endDate
                            )}
                        </strong>

                    </div>

                    <div class="reservation-duration">

                        <span class="date-label">
                            DURÉE
                        </span>

                        <strong>
                            ${reservation.duration}
                            jour${reservation.duration>1?"s":""}
                        </strong>

                    </div>

                </div>


                <div class="reservation-client">

                    <div class="client-item">

                        <span class="client-icon">
                            👤
                        </span>

                        <div>
                            <small>Client</small>
                            <strong>
                                ${escapeHTML(
                                    reservation.fullName
                                )}
                            </strong>
                        </div>

                    </div>

                    <div class="client-item">

                        <span class="client-icon">
                            📱
                        </span>

                        <div>
                            <small>WhatsApp</small>
                            <strong>
                                ${escapeHTML(
                                    reservation.phone
                                )}
                            </strong>
                        </div>

                    </div>

                    <div class="client-item">

                        <span class="client-icon">
                            📧
                        </span>

                        <div>
                            <small>Email</small>
                            <strong>
                                ${escapeHTML(
                                    reservation.email
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="reservation-actions">

                    <button
                        type="button"
                        class="reservation-details-button"
                        onclick="showReservationDetails('${escapeHTML(reservation.id)}')"
                    >
                        👁 Voir détails
                    </button>

                    <button
                        type="button"
                        class="reservation-delete-button"
                        onclick="deleteReservation('${escapeHTML(reservation.id)}')"
                    >
                        🗑 Supprimer
                    </button>

                </div>

            </div>

        </article>
    `;
}

function displayReservations(){

    if(!reservationsList)return;

    const reservations=getReservations();

    if(reservations.length===0){

        reservationsList.innerHTML="";

        if(emptyReservations){
            emptyReservations.style.display="block";
        }

        return;
    }

    if(emptyReservations){
        emptyReservations.style.display="none";
    }

    reservations.sort(
        (a,b)=>
            new Date(b.createdAt||0)-
            new Date(a.createdAt||0)
    );

    reservationsList.innerHTML=
        reservations
            .map(createReservationCard)
            .join("");
}

function showReservationDetails(reservationId){

    const reservations=getReservations();

    const reservation=reservations.find(
        item=>String(item.id)===String(reservationId)
    );

    if(!reservation){

        showToast(
            "Réservation introuvable.",
            "error"
        );

        return;
    }

    alert(
        `RÉSERVATION ${reservation.reservationNumber}\n\n`+
        `Voiture : ${reservation.carName}\n`+
        `Client : ${reservation.fullName}\n`+
        `Email : ${reservation.email}\n`+
        `WhatsApp : ${reservation.phone}\n\n`+
        `Départ : ${formatDate(reservation.startDate)}\n`+
        `Retour : ${formatDate(reservation.endDate)}\n`+
        `Durée : ${reservation.duration} jour(s)\n\n`+
        `Prix journalier : ${formatPrice(reservation.dailyPrice)}\n`+
        `Prix total : ${formatPrice(reservation.totalPrice)}`
    );
}

function deleteReservation(reservationId){

    const reservations=getReservations();

    const reservation=reservations.find(
        item=>String(item.id)===String(reservationId)
    );

    if(!reservation){

        showToast(
            "Réservation introuvable.",
            "error"
        );

        return;
    }

    if(
        !confirm(
            `Voulez-vous supprimer la réservation ${reservation.reservationNumber} ?`
        )
    ){
        return;
    }

    const updatedReservations=
        reservations.filter(
            item=>
                String(item.id)!==
                String(reservationId)
        );

    if(!saveReservations(updatedReservations)){

        showToast(
            "Impossible de supprimer la réservation.",
            "error"
        );

        return;
    }

    displayReservations();
    showToast("Réservation supprimée.");
}


/* FORM */

if(reservationForm){

    reservationForm.addEventListener(
        "submit",
        function(event){

            event.preventDefault();

            hideFormError();

            if(!currentCar){

                showFormError(
                    "La voiture sélectionnée est introuvable."
                );

                return;
            }

            if(currentCar.available===false){

                showFormError(
                    "Cette voiture n'est pas disponible actuellement."
                );

                return;
            }

            const fullName=
                fullNameInput
                ?fullNameInput.value.trim()
                :"";

            const email=
                emailInput
                ?emailInput.value.trim()
                :"";

            const phone=
                phoneInput
                ?phoneInput.value.trim()
                :"";

            const startDate=
                startDateInput
                ?startDateInput.value
                :"";

            const endDate=
                endDateInput
                ?endDateInput.value
                :"";


            /* NAME */

            if(!fullName){

                showFormError(
                    "Veuillez saisir votre nom complet."
                );

                fullNameInput?.focus();

                return;
            }

            if(fullName.length<3){

                showFormError(
                    "Le nom complet doit contenir au moins 3 caractères."
                );

                fullNameInput?.focus();

                return;
            }


            /* EMAIL */

            if(!email){

                showFormError(
                    "Veuillez saisir votre adresse email."
                );

                emailInput?.focus();

                return;
            }

            if(!isValidEmail(email)){

                showFormError(
                    "Veuillez saisir une adresse email valide."
                );

                emailInput?.focus();

                return;
            }


            /* PHONE */

            if(!phone){

                showFormError(
                    "Veuillez saisir votre numéro WhatsApp."
                );

                phoneInput?.focus();

                return;
            }

            if(!isValidPhone(phone)){

                showFormError(
                    "Numéro WhatsApp marocain invalide. Exemple : 0612345678 ou +212612345678."
                );

                phoneInput?.focus();

                return;
            }


            /* DATES */

            if(!startDate){

                showFormError(
                    "Veuillez sélectionner la date de début."
                );

                return;
            }

            if(!endDate){

                showFormError(
                    "Veuillez sélectionner la date de fin."
                );

                return;
            }

            if(
                !isValidDateString(startDate)||
                !isValidDateString(endDate)
            ){

                showFormError(
                    "Veuillez sélectionner des dates valides."
                );

                return;
            }


            const today=getTodayString();

            /* TODAY IS ALLOWED */

            if(
                dateToNumber(startDate)<
                dateToNumber(today)
            ){

                showFormError(
                    "La date de début ne peut pas être dans le passé."
                );

                return;
            }


            /* END DATE */

            if(
                dateToNumber(endDate)<=
                dateToNumber(startDate)
            ){

                showFormError(
                    "La date de fin doit être après la date de début."
                );

                return;
            }


            /* DURATION */

            const duration=calculateDuration();

            if(duration<=0){

                showFormError(
                    "La durée de réservation est invalide."
                );

                return;
            }


            /* CONFLICT */

            if(
                hasDateConflict(
                    currentCar.id,
                    startDate,
                    endDate
                )
            ){

                showFormError(
                    "Cette voiture est déjà réservée pendant cette période."
                );

                return;
            }


            /* PRICE */

            const dailyPrice=
                Number(currentCar.price)||0;

            const totalPrice=
                dailyPrice*duration;


            /* RESERVATION */

            const reservation={

                id:Date.now().toString(),

                reservationNumber:
                    generateReservationNumber(),

                carId:
                    currentCar.id,

                carName:
                    currentCar.name,

                carImage:
                    currentCar.image||"",

                category:
                    currentCar.category,

                year:
                    currentCar.year,

                transmission:
                    currentCar.transmission,

                fuel:
                    currentCar.fuel,

                seats:
                    currentCar.seats,

                dailyPrice:
                    dailyPrice,

                startDate:
                    startDate,

                endDate:
                    endDate,

                duration:
                    duration,

                totalPrice:
                    totalPrice,

                fullName:
                    fullName,

                email:
                    email,

                phone:
                    phone,

                status:
                    "À venir",

                createdAt:
                    new Date().toISOString()
            };


            /* SAVE */

            const reservations=
                getReservations();

            reservations.push(reservation);

            if(
                !saveReservations(reservations)
            ){

                showFormError(
                    "Une erreur est survenue lors de l'enregistrement."
                );

                return;
            }


            /* SUCCESS */

            displayReservations();

            if(successReservationNumber){

                successReservationNumber.textContent=
                    reservation.reservationNumber;
            }

            if(successModal){
                successModal.classList.add("show");
            }

            reservationForm.reset();

            if(startDateInput){
                startDateInput.min=
                    getTodayString();
            }

            if(endDateInput){
                endDateInput.min=
                    getTodayString();
            }

            updatePrice();

            showToast(
                "Réservation confirmée avec succès."
            );
        }
    );
}


/* START DATE */

if(startDateInput){

    startDateInput.min=getTodayString();

    startDateInput.addEventListener(
        "change",
        function(){

            hideFormError();

            const selectedStart=this.value;

            if(endDateInput){

                endDateInput.min=
                    selectedStart||
                    getTodayString();

                if(
                    endDateInput.value&&
                    dateToNumber(endDateInput.value)<
                    dateToNumber(selectedStart)
                ){

                    endDateInput.value="";
                }
            }

            updatePrice();
        }
    );
}


/* END DATE */

if(endDateInput){

    endDateInput.min=getTodayString();

    endDateInput.addEventListener(
        "change",
        function(){

            hideFormError();

            updatePrice();
        }
    );
}


/* INPUTS */

if(fullNameInput){
    fullNameInput.addEventListener(
        "input",
        hideFormError
    );
}

if(emailInput){
    emailInput.addEventListener(
        "input",
        hideFormError
    );
}

if(phoneInput){
    phoneInput.addEventListener(
        "input",
        hideFormError
    );
}


/* SUCCESS MODAL */

if(closeSuccessModal){

    closeSuccessModal.addEventListener(
        "click",
        function(){

            if(successModal){
                successModal.classList.remove("show");
            }
        }
    );
}

if(viewReservationsButton){

    viewReservationsButton.addEventListener(
        "click",
        function(){

            if(successModal){
                successModal.classList.remove("show");
            }

            const reservationsSection=
                document.querySelector(
                    ".reservations-section"
                );

            if(reservationsSection){

                reservationsSection.scrollIntoView({
                    behavior:"smooth"
                });

            }else{

                window.location.href=
                    "reservation.html";
            }
        }
    );
}

if(successModal){

    successModal.addEventListener(
        "click",
        function(event){

            if(event.target===successModal){
                successModal.classList.remove("show");
            }
        }
    );
}

document.addEventListener(
    "keydown",
    function(event){

        if(
            event.key==="Escape"&&
            successModal
        ){

            successModal.classList.remove("show");
        }
    }
);


/* MOBILE MENU */

const menuButton=
    document.getElementById("menuBtn");

const navLinks=
    document.getElementById("navLinks");

if(menuButton&&navLinks){

    menuButton.addEventListener(
        "click",
        function(){

            navLinks.classList.toggle(
                "active"
            );
        }
    );

    navLinks
        .querySelectorAll("a")
        .forEach(link=>{

            link.addEventListener(
                "click",
                function(){

                    navLinks.classList.remove(
                        "active"
                    );
                }
            );
        });
}


/* INITIALIZATION */

function initializeReservationPage(){

    console.log(
        "CarRental Reservation JS chargé correctement."
    );

    console.log(
        "URL :",
        window.location.href
    );

    console.log(
        "Car ID :",
        carId
    );

    currentCar=findCurrentCar();

    console.log(
        "Voiture sélectionnée :",
        currentCar
    );

    displayCarPreview();
    displayReservations();
    updatePrice();
}

initializeReservationPage();