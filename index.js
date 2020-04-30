import * as THREE from './node_modules/three/build/three.module.js';

let camera, scene, renderer;
let geometry, material, mesh;

class Boids {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
        this.camera.position.z = 2;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderContainer = document.getElementById('renderContainer');
    }

    init = () => {
        this.resize();
        this.renderContainer.appendChild(this.renderer.domElement)
        /* document.body */
        window.addEventListener("resize", this.resize)
    }

    resize = () => {
        this.camera.aspect = this.renderContainer.clientWidth / this.renderContainer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.renderContainer.clientWidth, this.renderContainer.clientHeight);

    }

    addActor = (posX = 0, posY = 0, posZ = 0) => {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshNormalMaterial();
        const mesh = new FlyingActor(geometry, material);
        mesh.velocity
        mesh.position.set(posX, posY, posZ);
        mesh.velocity.set(Math.random()/100,Math.random()/100,Math.random()/100);
        this.scene.add(mesh);
    }

    createRandom = (count = 20) => {
        this.init();
        for (let i = 0; i < count; i++) {
            this.addActor(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }
    }

    getCenter=(scene)=>{
        const sceneSize=scene.children.length;
        let averagePos=new THREE.Vector3(0, 0, 0);
        if(!sceneSize) return averagePos;
        
        for(let i=0; i<sceneSize; i++){ 
            averagePos.add(scene.children[i].position);
        }
        return averagePos.divideScalar(sceneSize);
    }

    start=()=>{
        console.log(this.scene)
        if(this.scene.children.length){
            this.cameraLookAtCenter();
            console.log(this.camera)
            this.run();
        }
        
    }

    run = () => {
        requestAnimationFrame(this.run);
        this.update();
        this.cameraLookAtCenter();
        this.render();
    }

    update = () => {
        for (const item of this.scene.children) {
            item.rotation.x += 0.01;
            item.rotation.y += 0.02;
            item.update();
        }
    }

    cameraLookAtCenter=()=>{
        const center=this.getCenter(this.scene);
        this.camera.lookAt(center);
    }

    render = () => {
        this.renderer.render(this.scene, this.camera);
    }

}

class FlyingActor extends THREE.Mesh {
    constructor(geometry, material) {
        super(geometry, material);

        this.velocity=new THREE.Vector3(0,0,0);
    }

    update = () => {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
    }

    
}

function init() {
    const boids = new Boids();
    /* boids.init(); */
    boids.createRandom();
    boids.start();
}


init();