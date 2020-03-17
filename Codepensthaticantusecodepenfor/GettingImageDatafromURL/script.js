var image = document.getElementById("ds");
image.crossOrigin = "Anonymous";
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.height = image.height;
canvas.width  = image.width;
window.onload(function(){
    ctx.drawImage(image,0,0); 
})
/*
var imageDataUri = canvas.toDataURL('image/png', 0.5);

image.src = imageDataUri;*/