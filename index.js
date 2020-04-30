import * as THREE from './node_modules/three/build/three.module.js';

let camera, scene, renderer;
let geometry, material, mesh;

class Boids {
    actors;
    constructor() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
        this.camera.position.z = 2;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderContainer = document.getElementById('renderContainer');
        this.actors=[]
    }

    init = () => {
        this.resize();
        this.renderContainer.appendChild(this.renderer.domElement)
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
        /* mesh.velocity.set(Math.random()/100,Math.random()/100,Math.random()/100); */
        this.scene.add(mesh);
        this.actors.push(mesh);
    }

    createRandom = (count = 20) => {
        this.init();
        for (let i = 0; i < count; i++) {
            this.addActor(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }
    }

    getCenter=(actors)=>{
        const sceneSize=actors.length;
        let averagePos=new THREE.Vector3(0, 0, 0);
        if(!sceneSize) return averagePos;
        
        for(let i=0; i<sceneSize; i++){ 
            averagePos.add(actors[i].position);
        }
        return averagePos.divideScalar(sceneSize);
    }

    start=()=>{
        console.log(this.scene)
        if(this.scene.children.length){
            this.cameraLookAtCenter();
            this.run();
        }
        
    }

    run = () => {
        requestAnimationFrame(this.run);
        this.update(this.actors);
        this.cameraLookAtCenter();
        this.render();
    }

    update = (actors) => {
        for (const item of this.actors) {
            item.update(actors);
        }
    }

    cameraLookAtCenter=()=>{
        const center=this.getCenter(this.actors);
        this.camera.lookAt(center);
    }

    render = () => {
        this.renderer.render(this.scene, this.camera);
    }

}

class FlyingActor extends THREE.Mesh {
    acceleration=new THREE.Vector3(0);
    velocity=new THREE.Vector3(0,0,0);
    maxForce=0.001;
    maxSpeed=0.01;
    constructor(geometry, material) {
        super(geometry, material);
        
    }
    update=(actors)=>{
        this.boidBehavior(actors)
        this.applyForce();
        this.updatePos();
    }

    boidBehavior=(actors)=>{
        const sep=this.avoidCollision(actors);
        
        sep.multiplyScalar(0.2);
        this.velocity.add(sep);
    }

    applyForce=()=>{
        this.velocity.add(this.acceleration).clampLength(0, this.maxSpeed);
        this.acceleration.set(0,0,0);
    }

    updatePos = () => {
        this.position.add(this.velocity);
    }

    steerTo=(target)=>{
        const targetVec=new THREE.Vector3().subVectors(this.position, target);

        targetVec.setLength(this.maxSpeed);   
        
        const steer=new THREE.Vector3().subVectors(this.velocity, targetVec);
        steer.clampLength(0, this.maxForce)
        return steer;
    }

    dontLeaveWorld=(distance, treshhold)=>{
        // apply force that prevents body from leaving a certain region most likely a sphere for now so distance from center should be fine
        const vecLen=this.position.length();
        if(vecLen>(distance-treshhold)){
            /* console.log(vecLen) */
            this.velocity.copy(this.velocity.negate());
        }
    }

    avoidCollision=(otherActors)=>{
        // apply force that steers body away from others
        const seperation=0.46;

        const steer=new THREE.Vector3(0,0,0);
        let closeActors=0;

        const actorsLen=otherActors.length;
        
        for(let i=0; i<actorsLen; i++){
            const actorDist=this.position.distanceTo(otherActors[i].position);

            if(actorDist>0 && actorDist<seperation){
                const vecDir=new THREE.Vector3().subVectors(this.position, otherActors[i].position);
                vecDir.normalize()
                vecDir.divideScalar(actorDist);
                steer.add(vecDir);
                closeActors++;
            }
        }
        if(closeActors>0){
            steer.divideScalar(closeActors)

        }

        if(steer.length()>0){
            steer.setLength(this.maxSpeed);
            steer.sub(this.velocity);
            steer.clampLength(0, this.maxForce)
        }
        return steer;
    }

    allign=(otherActors)=>{
        const dist=0.2;
        const sum=new THREE.Vector3(0,0,0);
    }


    


    
}

function init() {
    const boids = new Boids();
    /* boids.init(); */
    boids.createRandom();
    boids.start();
}


init();



