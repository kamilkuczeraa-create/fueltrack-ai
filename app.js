let data = JSON.parse(localStorage.getItem("fueltrack")) || [];


document.getElementById("today").innerHTML =
new Date().toLocaleDateString("pl-PL");


function addMeal(){


let meal = {

name:
document.getElementById("mealName").value,


calories:
Number(document.getElementById("mealCalories").value),


protein:
Number(document.getElementById("mealProtein").value),


carbs:
Number(document.getElementById("mealCarbs").value),


fat:
Number(document.getElementById("mealFat").value),


date:
new Date().toLocaleDateString("pl-PL")

};


data.push(meal);


localStorage.setItem(
"fueltrack",
JSON.stringify(data)
);


clearInputs();

update();


}



function clearInputs(){

document.getElementById("mealName").value="";
document.getElementById("mealCalories").value="";
document.getElementById("mealProtein").value="";
document.getElementById("mealCarbs").value="";
document.getElementById("mealFat").value="";

}



function update(){


let calories=0;
let protein=0;
let carbs=0;
let fat=0;


let today =
new Date().toLocaleDateString("pl-PL");



data
.filter(x=>x.date===today)
.forEach(x=>{


calories+=x.calories;

protein+=x.protein;

carbs+=x.carbs;

fat+=x.fat;


});


document.getElementById("calories").innerHTML =
calories;


document.getElementById("protein").innerHTML =
protein;


document.getElementById("carbs").innerHTML =
carbs;


document.getElementById("fat").innerHTML =
fat;



let history="";


data.forEach(x=>{


history +=

`
<div class="history-item">

<b>${x.date}</b><br>

${x.name}<br>

${x.calories} kcal |
B:${x.protein} |
W:${x.carbs} |
T:${x.fat}

</div>
`;

});


document.getElementById("history").innerHTML =
history;


}


update();