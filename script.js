const CARS_KEY="carRentalCars";

const defaultCars=[
{id:1,name:"Volkswagen Golf 8",category:"economique",year:2024,transmission:"Automatique",fuel:"Essence",seats:5,price:350,image:"images/golf.jpg",description:"Une voiture moderne, économique et parfaite pour vos déplacements quotidiens.",available:true},
{id:2,name:"Volkswagen Passat",category:"berline",year:2023,transmission:"Automatique",fuel:"Diesel",seats:5,price:450,image:"images/passat.jpg",description:"Une berline confortable et élégante, idéale pour les longs trajets.",available:true},
{id:3,name:"Renault Clio",category:"economique",year:2024,transmission:"Manuelle",fuel:"Essence",seats:5,price:250,image:"images/clio.jpg",description:"Compacte, économique et facile à conduire en ville.",available:true},
{id:4,name:"Mercedes-Benz Classe C",category:"luxe",year:2024,transmission:"Automatique",fuel:"Essence",seats:5,price:750,image:"images/mercedes.jpg",description:"Une voiture premium qui combine confort, élégance et performances.",available:true},
{id:5,name:"Dacia Duster",category:"suv",year:2024,transmission:"Manuelle",fuel:"Diesel",seats:5,price:400,image:"images/duster.jpg",description:"Un SUV polyvalent et robuste, parfait pour la ville comme pour les voyages.",available:true},
{id:6,name:"Peugeot 3008",category:"suv",year:2024,transmission:"Automatique",fuel:"Diesel",seats:5,price:500,image:"images/peugeot3008.jpg",description:"Un SUV moderne, spacieux et confortable pour toute la famille.",available:true}
];

function getCars(){
    try{
        const saved=localStorage.getItem(CARS_KEY);
        if(!saved){
            localStorage.setItem(CARS_KEY,JSON.stringify(defaultCars));
            return [...defaultCars];
        }
        const cars=JSON.parse(saved);
        if(!Array.isArray(cars)){
            localStorage.setItem(CARS_KEY,JSON.stringify(defaultCars));
            return [...defaultCars];
        }
        return cars;
    }catch(error){
        console.error("Erreur récupération voitures:",error);
        return [...defaultCars];
    }
}

let cars=getCars();

const carsContainer=document.getElementById("carsContainer");
const searchBtn=document.getElementById("searchButton");
const categorySelect=document.getElementById("categoryFilter");
const maxPriceInput=document.getElementById("priceFilter");
const categoryButtons=document.querySelectorAll(".category-btn");
const menuButton=document.getElementById("menuButton");
const navLinks=document.getElementById("navLinks");
const toast=document.getElementById("toast");
const toastMessage=document.getElementById("toastMessage");
const toastIcon=document.getElementById("toastIcon");

function formatCategory(category){
    const categories={economique:"Économique",berline:"Berline",suv:"SUV",luxe:"Luxe"};
    return categories[category]||category||"Autre";
}

function formatPrice(price){
    return Number(price||0).toLocaleString("fr-FR")+" DH";
}

function showToast(message,type="success"){
    if(!toast||!toastMessage||!toastIcon)return;
    toastMessage.textContent=message;
    toastIcon.textContent=type==="error"?"✕":"✓";
    toast.classList.add("show");
    setTimeout(()=>toast.classList.remove("show"),3000);
}

function escapeHTML(value){
    return String(value??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function showLoading(show=true){
    if(!carsContainer)return;
    if(show){
        carsContainer.innerHTML=`
            <div class="cars-loading">
                <div class="loading-spinner"></div>
                <p>Recherche en cours...</p>
            </div>
        `;
    }
}

function displayCars(carsToDisplay){
    if(!carsContainer)return;

    carsContainer.innerHTML="";

    if(!carsToDisplay||carsToDisplay.length===0){
        carsContainer.innerHTML=`
            <div class="no-cars">
                <div class="no-cars-icon">🚗</div>
                <h3>Aucune voiture trouvée</h3>
                <p>Aucune voiture ne correspond à votre recherche.</p>
                <button class="reset-search-btn" id="resetSearchBtn" type="button">Réinitialiser la recherche</button>
            </div>
        `;

        const resetButton=document.getElementById("resetSearchBtn");
        if(resetButton)resetButton.addEventListener("click",resetSearch);
        return;
    }

    carsToDisplay.forEach(car=>{
        const card=document.createElement("article");
        card.className="car-card";

        const available=car.available!==false;

        const image=car.image?`
            <img src="${escapeHTML(car.image)}" alt="${escapeHTML(car.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="car-image-placeholder" style="display:none;">🚗</div>
        `:`
            <div class="car-image-placeholder">🚗</div>
        `;

        card.innerHTML=`
            <div class="car-image">
                ${image}
                ${!available?`<div class="car-unavailable-badge">Indisponible</div>`:""}
            </div>

            <div class="car-content">
                <div class="car-category">${escapeHTML(formatCategory(car.category))}</div>
                <h3 class="car-title">${escapeHTML(car.name)}</h3>

                <div class="car-details">
                    <span class="car-detail">📅 ${escapeHTML(car.year||"-")}</span>
                    <span class="car-detail">⚙️ ${escapeHTML(car.transmission||"-")}</span>
                    <span class="car-detail">⛽ ${escapeHTML(car.fuel||"-")}</span>
                    <span class="car-detail">👥 ${escapeHTML(car.seats||"-")}</span>
                </div>

                <p class="car-description">${escapeHTML(car.description||"")}</p>

                <div class="car-bottom">
                    <div class="car-price">${formatPrice(car.price)}<span>/ jour</span></div>
                    <button type="button" class="reserve-btn${!available?" disabled":""}" data-car-id="${escapeHTML(car.id)}" ${!available?"disabled":""}>
                        ${available?"Réserver":"Indisponible"}
                    </button>
                </div>
            </div>
        `;

        carsContainer.appendChild(card);
    });

    attachReservationButtons();
}

function attachReservationButtons(){
    const buttons=document.querySelectorAll(".reserve-btn:not(.disabled)");

    buttons.forEach(button=>{
        button.addEventListener("click",function(){
            const carId=this.dataset.carId;
            if(!carId)return;
            window.location.href=`reservation.html?id=${encodeURIComponent(carId)}`;
        });
    });
}

function searchCars(){
    const category=categorySelect?categorySelect.value:"all";
    const maxPrice=maxPriceInput?Number(maxPriceInput.value):0;

    let filtered=getCars();

    filtered=filtered.filter(car=>car.available!==false);

    if(category&&category!=="all"){
        filtered=filtered.filter(car=>car.category===category);
    }

    if(maxPrice&&maxPrice>0){
        filtered=filtered.filter(car=>Number(car.price)<=maxPrice);
    }

    showLoading(true);

    setTimeout(()=>{
        displayCars(filtered);

        if(filtered.length>0){
            showToast(`${filtered.length} voiture(s) trouvée(s).`);
        }else{
            showToast("Aucune voiture ne correspond à votre recherche.","error");
        }
    },350);
}

function resetSearch(){
    if(categorySelect)categorySelect.value="all";
    if(maxPriceInput)maxPriceInput.value="";

    categoryButtons.forEach(button=>button.classList.remove("active"));

    const allButton=document.querySelector('.category-btn[data-category="all"]');
    if(allButton)allButton.classList.add("active");

    cars=getCars();

    const availableCars=cars.filter(car=>car.available!==false);
    displayCars(availableCars);
}

categoryButtons.forEach(button=>{
    button.addEventListener("click",function(){
        categoryButtons.forEach(item=>item.classList.remove("active"));
        this.classList.add("active");

        const category=this.dataset.category;

        if(categorySelect)categorySelect.value=category;

        searchCars();
    });
});

if(searchBtn){
    searchBtn.addEventListener("click",searchCars);
}

if(maxPriceInput){
    maxPriceInput.addEventListener("keydown",function(event){
        if(event.key==="Enter")searchCars();
    });
}

if(categorySelect){
    categorySelect.addEventListener("change",function(){
        categoryButtons.forEach(button=>button.classList.remove("active"));

        const selected=document.querySelector(`.category-btn[data-category="${this.value}"]`);

        if(selected)selected.classList.add("active");

        searchCars();
    });
}

if(menuButton&&navLinks){
    menuButton.addEventListener("click",function(){
        navLinks.classList.toggle("active");
    });

    navLinks.querySelectorAll("a").forEach(link=>{
        link.addEventListener("click",function(){
            navLinks.classList.remove("active");
        });
    });
}

cars=getCars();

const availableCars=cars.filter(car=>car.available!==false);

displayCars(availableCars);

const urlParams=new URLSearchParams(window.location.search);

if(urlParams.get("checkout")==="1"){
    const bookingSection=document.getElementById("booking");

    if(bookingSection){
        setTimeout(()=>{
            bookingSection.scrollIntoView({behavior:"smooth"});
        },300);
    }
}