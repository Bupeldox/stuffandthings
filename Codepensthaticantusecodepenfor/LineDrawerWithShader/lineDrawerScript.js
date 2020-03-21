

var settings = {
    sweepRadius:2,
    walkerMass:0.1,
    maxVelocity:1,
    reduction:0.1,
    startPos:{x:80,y:200},
    restart:function(){setup();}
}

window.onload = function() {
    var gui = new dat.GUI();
    gui.add(settings, 'sweepRadius').step(1).min(1);
    gui.add(settings, 'walkerMass').min(0.000001);
    gui.add(settings, 'maxVelocity').min(0);
    gui.add(settings, 'reduction').min(0);
    gui.add(settings.startPos, 'x');
    gui.add(settings.startPos, 'y');
    gui.add(settings, 'restart');
  };


var s = settings;

class MyImageData{
    constructor(raw,width,height){
        this.raw = raw.data;
        this.data = [];
        this.width = raw.width;
        this.height = raw.height;
        
        var index = 0;
        for(var y = 0;y<this.height;y++){
            for(var x = 0;x<this.width;x++){
                if(this.data.length<=x){
                        this.data[x] = [];
                }
                var col = new Color(this.raw[index],this.raw[index+1],this.raw[index+2])
                index+=4;
                this.data[x][y] = col;
            }
        }
    }
    
    FromColors(colors){
        this.raw = undefined;
        this.data = colors;
        this.width = colors.length;
        this.height = colors[0].length;
    }
    
    GetMyImageData(){
        var output = [];
        var index = 0;
        for(var y = 0;y<this.height;y++){
            for(var x = 0;x<this.width;x++){
            
                var col = this.data[x][y];
                var alpha = 255;
                
                if(col.r > 253){
                    alpha = 0;
                }
                output[index] =   Math.floor(col.r);
                output[index+1] = Math.floor(col.g);
                output[index+2] = Math.floor(col.b);
                output[index+3] = alpha;
                index+=4;
            }
        }
        var oout = new ImageData(Uint8ClampedArray.from(output),this.width,this.height);
    
        return oout;
    }
}

class Color{
    constructor(r,g,b){
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Lighten(val){
        this.r *= val;
        this.g *= val;
        this.b *= val;
    }
    GetString(){
        return "rgb("+this.r+","+this.g+","+this.b+")";
    }
    GetLightness(){
        return (this.r+this.g+this.b)/(255*3);
    }
}
class Vec2 {
     constructor(x, y) {
          if(x.hasOwnProperty("x")){
               var out = y.sub(x);
               this.x = out.x;
               this.y = out.y
          }else{
               this.x = x;
               this.y = y;
          }
     }

     distance(vec) {
          var delta = this.sub(vec);
          return delta.magnitude();
     }

     add(vec) {
          return new Vec2(this.x + vec.x, this.y + vec.y);
     }
     sub(vec) {
          return new Vec2(this.x - vec.x, this.y - vec.y);
     }
     times(factor) {
          return new Vec2(this.x * factor, this.y * factor);
     }
     magnitude() {
          return Math.sqrt(this.x * this.x + this.y * this.y);
     }
     normalised() {
          var out = this.times(1 / this.magnitude());
          return new Vec2(out.x,out.y);
     }
     dot(vec){
          return this.x * vec.x + this.y * vec.y;
     }
     angle(vec){
            return Math.acos((this.x * vec.x + this.y * vec.y) / Math.sqrt(this.x * this.x + this.y * this.y) / Math.sqrt(vec.x * vec.x + vec.y * vec.y));
     }
     
     clone(){
          return new Vec2(this.x,this.y);
     }
     Draw(ctx,from){
        ctx.beginPath();
        ctx.strokeStyle = "red";
        var toVec = from.add(this)
        ctx.moveTo(from.x,from.y);
        ctx.lineTo(toVec.x,toVec.y);
        ctx.stroke();
    }
}

class WalkerController{
    constructor(imageDataobj){
        this.bwMap =[];
        
        //this.shaderContext = document.getElementById("shaderCanvas").getContext("gsgl");

        var imageData = imageDataobj.data;
        //s.sweepRadius = s.sweepRadius;
        for(var x=0;x<imageDataobj.width;x++){
            this.bwMap[x] = [];
            for(var y=0;y<imageDataobj.height;y++){
                this.bwMap[x][y] = (imageData[x][y].GetLightness());
                //this.bwMap[x][y] = (imageData[x][y].b/255);
            }
        }
        this.walker = new Walker();
    }

    Update(){
        
        //var forceMap = shaderCanvas.getImageData(0,0,shaderCanvas.height,shaderCanvas.width);
        
        var shaderOutput = UpdateShaderCanvas(this.walker.pos);
        
        this.walker.Update(shaderOutput);
        
        
        var walkerPos = this.walker.pos.clone();
        walkerPos.x = Math.floor(walkerPos.x);
        walkerPos.y = Math.floor(walkerPos.y);
        
        
        for(var cx = -s.sweepRadius;cx<s.sweepRadius;cx++){
            for(var cy = -s.sweepRadius;cy<s.sweepRadius;cy++){
                var removePos = new Vec2(walkerPos.x + cx,walkerPos.y + cy);
                if(removePos.x>=0 && removePos.y>=0 && removePos.y<this.bwMap[0].length && removePos.x<this.bwMap.length){
                    if(new Vec2(cx,cy).magnitude()<s.sweepRadius){
                        this.bwMap[removePos.x][removePos.y]+=s.reduction;
                        if(this.bwMap[removePos.x][removePos.y]>=1){
                            this.bwMap[removePos.x][removePos.y] = 1;
                        }
                    }
                }
            }
        }

    }

    DrawProgress(ctx){
        var colorGrid = [];
        
        for(var x=0;x<this.bwMap.length;x++){
            colorGrid[x] = [];
            for(var y=0;y<this.bwMap[0].length;y++){
                var val = (this.bwMap[x][y])*255;
                colorGrid[x][y]  = new Color(val,val,val);
            }
        }
        
        var thisImage = new MyImageData({data:2},2,2);
        thisImage.FromColors(colorGrid);
        ctx.putImageData(thisImage.GetMyImageData(),0,0);
    }

    Draw(ctx){
        
        
        /*
        ctx.fillStyle="rgba(255,255,255,"+s.reduction+")";
        ctx.fillRect(this.walker.pos.x-s.sweepRadius,this.walker.pos.y-s.sweepRadius,s.sweepRadius*2,s.sweepRadius*2);
*/
        this.walker.Draw(finalDrawingContext);
    }
}
class Walker{
    constructor(startPos){
        this.pos = new Vec2(s.startPos.x,s.startPos.y);
        this.vel = new Vec2(0,0)
        this.mass = s.walkerMass;
        this.maxVelocity = 20;
    }
    Update(shaderOutput){

        var force = new Vec2(0,0);

        for (var index = 0;index<shaderOutput.length;index+=4){
            var tForce = new Vec2(shaderOutput[index]-127,shaderOutput[index+1]-127);
            force = force.add(tForce);
        }
        

        /*
        for(var x = 0;x<attractors.length;x++){
            for(var y = 0;y<attractors[0].length;y++){
                if(attractors[x][y]!=1 || attractors[x][y]!=0 ){
                    var pPos = new Vec2(x,y)
                    var dv = pPos.add(this.pos.times(-1));
                    
                    if(dv.magnitude()>1){
                
                        var attractorValue = Math.pow(1-attractors[x][y],2);
                        var forceMagnitude = attractorValue/(dv.magnitude());
                        var tforce = dv.normalised().times(forceMagnitude);
                        
                        tforce = tforce.times(tforce.magnitude());

                        //tforce.times(1000).Draw(outputContext,this.pos);
                        
                    }
                }
            }
        }*/
        //f=ma a=f/m
        var acceleration = force.times(1/this.mass)
        this.vel = this.vel.add(acceleration);
        //this.vel = acceleration;
        
            this.vel = this.vel .normalised().times(s.maxVelocity);
        
        this.pos = this.pos.add(this.vel);
        
        
        
        
    }
    Draw(ctx){
        
        var from = this.pos.add(this.vel.times(-1));
        var to = this.pos;
        ctx.beginPath();
        ctx.moveTo(from.x,from.y);
        ctx.lineTo(to.x,to.y);
        ctx.stroke();
        /*
        ctx.beginPath();
        ctx.fillStyle="green";
        ctx.arc(this.pos.x, this.pos.y, 1, 0, 2 * Math.PI);
        ctx.fill();*/
    }
}


var canvas,ctx,image,going,outputCanvas,outputContext,finalDrawingCanvas,finalDrawingContext,walkerController;
function setup(){

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    image = document.getElementById("ref");
    going = true;

    image.crossOrigin = "Anonymous";

    var imageHeight = image.height;
    var imageWidth = image.width;

    ctx.canvas.height = imageHeight;
    ctx.canvas.width  = imageWidth;

    ctx.drawImage(image,0,0);

    var rawMyImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    var imageData = new MyImageData(rawMyImageData,image.width,image.height);
    //ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);

    walkerController = new WalkerController(imageData);

    outputCanvas = document.getElementById("output");
    outputContext = outputCanvas.getContext("2d");

    outputContext.canvas.height = imageHeight;
    outputContext.canvas.width  = imageWidth;

    outputContext.putImageData(imageData.GetMyImageData(),0,0);

    finalDrawingCanvas = document.getElementById("final");
    finalDrawingContext = finalDrawingCanvas.getContext("2d");

    finalDrawingContext.canvas.height = imageHeight;
    finalDrawingContext.canvas.width  = imageWidth;

}
setup();

function updateProgress(){
    walkerController.DrawProgress(outputContext);
}

walkerController.Update();
function UpdateLoop(count){
    if(count==0){
        return;
    }
    
    walkerController.Draw(outputContext);
    walkerController.Update();
    
    if(going){
   //requestAnimationFrame(function(){UpdateLoop(count-1)},);
    setTimeout(function(){UpdateLoop(2);},1);
    }
}

function toggleGoing(){
    going = !going;
    if(going){
        UpdateLoop()
    }
}

UpdateLoop(2);

