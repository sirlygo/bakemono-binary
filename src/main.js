import * as THREE from 'three';

const canvas=document.getElementById('game');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);

const camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.set(6,6,6);

const light=new THREE.AmbientLight(0xffffff,1);
scene.add(light);

const ground=new THREE.Mesh(
 new THREE.PlaneGeometry(20,20),
 new THREE.MeshStandardMaterial({color:0x8ed081})
);

ground.rotation.x=-Math.PI/2;
scene.add(ground);

function house(x,z){

const base=new THREE.Mesh(
 new THREE.BoxGeometry(2,2,2),
 new THREE.MeshStandardMaterial({color:0xffffff})
);

base.position.set(x,1,z);
scene.add(base);

const roof=new THREE.Mesh(
 new THREE.ConeGeometry(1.6,1,4),
 new THREE.MeshStandardMaterial({color:0xff4444})
);

roof.position.set(x,2.5,z);
roof.rotation.y=Math.PI*0.25;
scene.add(roof);

}

house(0,6);
house(-4,4);
house(4,4);

const player=new THREE.Mesh(
 new THREE.CapsuleGeometry(0.3,0.8,4,8),
 new THREE.MeshStandardMaterial({color:0xffffff})
);

player.position.y=0.8;
scene.add(player);

const keys={};
let camAngle=Math.PI*0.25;

window.addEventListener('keydown',e=>keys[e.code]=true);
window.addEventListener('keyup',e=>keys[e.code]=false);

function update(){

const speed=0.08;

if(keys['KeyW']) player.position.z-=speed;
if(keys['KeyS']) player.position.z+=speed;
if(keys['KeyA']) player.position.x-=speed;
if(keys['KeyD']) player.position.x+=speed;

if(keys['KeyQ']) camAngle+=0.03;
if(keys['KeyE']) camAngle-=0.03;

const dist=6;

camera.position.x=player.position.x+Math.sin(camAngle)*dist;
camera.position.z=player.position.z+Math.cos(camAngle)*dist;
camera.position.y=5;

camera.lookAt(player.position);

}

function loop(){

update();
renderer.render(scene,camera);
requestAnimationFrame(loop);

}

loop();
