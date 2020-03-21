"use strict";
const vs = `
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main() {
  gl_Position = matrix * position;
  v_texcoord = texcoord;
}
`;
const fs = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D tex;
uniform vec2 mousePos;
uniform vec2 iResolution;

void main() {
    vec2 mouseUV= mousePos.xy/iResolution.xx;

    vec2 uv = gl_FragCoord.xy/iResolution.xx;

    vec4 color = texture2D(tex,v_texcoord);
    
    float brightness = 1.0-((color.x+color.y+color.z)/3.0);

    vec2 mouseDelta =(uv-mouseUV);

    float magnitude = length(mouseDelta);
    float minDistance = 1.0/iResolution.x;
    if(magnitude <minDistance) {
        gl_FragColor = vec4(0.5,0.5,0.0,1.0);
    }
    else{
        float forceMagnitude = pow(brightness/magnitude,2.0);
        vec2 force = normalize(mouseDelta)*forceMagnitude;

        vec2 renderCol = (vec2(force/255.0))+vec2(0.5,0.5);
        
        gl_FragColor = vec4(renderCol.xy,0.0,1.0);
    }
}
`;
const m4 = twgl.m4;
const gl = document.getElementById("shaderCanvas").getContext("webgl",{preserveDrawingBuffer: true});

//const info = document.querySelector("#info");

// compiles shaders, link program, looks up locations
const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

// calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

const textureInfo = {
  width: 1,
  height: 1,
};
var referenceImage = document.getElementById("ref");

const texture  = twgl.createTexture(gl,{
    fromCanvas: { src: document.getElementById("output") },
});

/*
const texture = twgl.createTexture(gl, {
  src: referenceImage.src,
  crossOrigin: '',
  flipY: true,
}, (err, tex, img) => {
  textureInfo.width = img.width;
  textureInfo.height = img.height;
  render();
});
*/

const resolution = [0, 0];
resolution[0] = referenceImage.width;
resolution[1] = referenceImage.height;
gl.canvas.width = resolution[0];
gl.canvas.height = resolution[1];

const mousePos = [0, 0];

function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
  gl.useProgram(programInfo.program);
  
  // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  
  // cover canvas with image  
  const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const imageAspect = textureInfo.width / textureInfo.height;

  // this assumes we want to fill vertically
  let horizontalDrawAspect = imageAspect / canvasAspect;
  let verticalDrawAspect = 1;
  // does it fill horizontally?
  if (horizontalDrawAspect < 1) {
    // no it does not so scale so we fill horizontally and
    // adjust vertical to match
    verticalDrawAspect /= horizontalDrawAspect;
    horizontalDrawAspect = 1;
  }
  const mat = m4.scaling([horizontalDrawAspect, verticalDrawAspect, 1]);
  
  // calls gl.activeTexture, gl.bindTexture, gl.uniform
  twgl.setUniforms(programInfo, {
    tex: texture,
    matrix: mat,
    mousePos: mousePos,
    iResolution: resolution,
  });
  
  twgl.drawBufferInfo(gl, bufferInfo);
}
render();

function UpdateShaderCanvas(pos){
  
    mousePos[0] = pos.x;
    mousePos[1] = gl.canvas.height-pos.y;
    var imageData = new Uint8Array(gl.canvas.height*gl.canvas.width*4);
    render();
    gl.readPixels(0,0,shaderCanvas.height,shaderCanvas.width,gl.RGBA,gl.UNSIGNED_BYTE,imageData);
    return imageData;

}
/*
gl.canvas.addEventListener('mousemove', e => {
  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();

  const x = (e.clientX - rect.left) * canvas.width / rect.width;
  const y = (e.clientY - rect.top)  * canvas.height / rect.height;
  mousePos[0] = x;
  mousePos[1] = canvas.height - y - 1;
  
  render();
});
*/