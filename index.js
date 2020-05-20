import * as THREE from './node_modules/three/build/three.module.js';
import {
    Boid3D,
    Boid2D
} from './Boid.mjs';
import FlyControlls from './flyCamera.mjs'

class BoidsRenderer {
    updateFunction;
    constructor(type = "3D") {
        this.type = type;
        this.camera = type === "2D" ?
            new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / -2, window.innerHeight / 2, 1, 1000) :
            new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000)
        this.camera.position.z = 20;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderContainer = document.getElementById('renderContainer');
        this.resize();
        this.renderContainer.appendChild(this.renderer.domElement)
        window.addEventListener("resize", this.resize)

        this.lastRender = 0;
    }

    setMode2d = () => {
        if (this.camera.isOrthographicCamera) return
        this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / -2, window.innerHeight / 2, 1, 1000)

    }
    setMode3d = () => {
        if (!this.camera.isOrthographicCamera) return
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    }

    resize = () => {
        this.camera.isOrthographicCamera ?
            this.resizeOrtho() :
            this.camera.aspect = this.renderContainer.clientWidth / this.renderContainer.clientHeight;

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.renderContainer.clientWidth, this.renderContainer.clientHeight);

    }

    resizeOrtho = () => {
        this.camera.left = window.innerWidth / -2;
        this.camera.right = window.innerWidth / 2;
        this.camera.top = window.innerHeight / -2;
        this.camera.bottom = window.innerHeight / 2;
    }

    start = () => {
        console.log(this.scene)
        if (this.scene.children.length) {
            if (this.updateFunction) {
                this.lastRender = Date.now();
                return this.runWithUpdate();
            }
            this.run();
        }

    }

    run = () => {
        requestAnimationFrame(this.run);
        this.render();
    }

    runWithUpdate = () => {
        requestAnimationFrame(this.runWithUpdate);
        const now = Date.now();
        this.updateFunction(now - this.lastRender);
        this.render();
        this.lastRender = now;
    }

    render = () => {
        this.renderer.render(this.scene, this.camera);
    }
}

class Boids {
    constructor(options = {
        accelerationVector: new THREE.Vector3(),
        velocityVector: new THREE.Vector3(),
        maxForce: 0.03,
        maxSpeed: 0.4,
        seperationDist: 1.1,
        allignDist: 10,
        cohesionDist: 10,
        homeDist: 200.0,
        seperationWeight: 1.5,
        allignmentWeight: 1.1,
        cohesionWeight: 1.0
    }) {
        this.boidsGroup = new THREE.Group();

        this.maxForce = options.maxForce;
        this.maxSpeed = options.maxSpeed;

        this.seperationDist = options.seperationDist;
        this.allignDist = options.allignDist;
        this.cohesionDist = options.cohesionDist;
        this.homeDist = options.homeDist;
        this.seperationWeight = options.seperationWeight;
        this.allignmentWeight = options.allignmentWeight;
        this.cohesionWeight = options.cohesionWeight;
    }

    createRandom = (count = 60) => {
        this.init();
        for (let i = 0; i < count; i++) {
            this.addActor(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }
    }

    addBoid = (boid) => {
        this.boidsGroup.add(boid);
        return this.boidsGroup;
    }


    createBoid = (posX = 0, posY = 0, posZ = 0, options, type = "3D") => {
        /* const geometry = new THREE.ConeGeometry(1, 3, 5); */
        const material = new THREE.MeshNormalMaterial();
        const mesh = type === "2D" ?
            new Boid2D(new THREE.ConeGeometry(8, 20, 5), material, options) :
            new Boid3D(new THREE.ConeGeometry(1, 3, 5), material, options);

        mesh.position.set(posX, posY, posZ);
        this.boidsGroup.add(mesh);
        return this.boidsGroup;
    }

    createBoid2D = (posX, posY, options) => this.createBoid(posX, posY, 0, options, "2D");


    createBoid3D = (posX, posY, posZ, options) => this.createBoid(posX, posY, posZ, options)

    updateBoidsOptions = (
        options = {
            acceleration,
            velocity,
            maxForce,
            maxSpeed,
            seperationDist,
            allignDist,
            cohesionDist,
            homeDist,
            seperationWeight,
            allignmentWeight,
            cohesionWeight
        }) => {
        /* loop over all boids and update their options */
        for (const boid of this.boidsGroup.children) {
            boid.updateOptions(options);
        }
    }

    clearBoids = () => {
        this.boidsGroup = new THREE.Group();
    }

    createRandom = (count = 60, type = "3D") => {
        this.clearBoids();
        if (type === "2D") {
            for (let i = 0; i < count; i++) {
                const posXScreenRange = (Math.random() - 0.5) * window.innerWidth;
                const posYScreenRange = (Math.random() - 0.5) * window.innerHeight;
                const minScreen = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
                this.createBoid2D(posXScreenRange, posYScreenRange, {
                    homeDist: minScreen
                });
            }
        } else
            for (let i = 0; i < count; i++) {
                this.createBoid3D(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            }
        return this.boids;
    }

    createRandom2D = (count) => this.createRandom(count, "2D");

    createRandom3D = (count) => this.createRandom(count, "3D");

    getCenter = () => {
        const sceneSize = this.boidsGroup.children.length;
        let averagePos = new THREE.Vector3(0, 0, 0);
        if (!sceneSize) return averagePos;

        for (let i = 0; i < sceneSize; i++) {
            averagePos.add(this.boidsGroup.children[i].position);
        }
        return averagePos.divideScalar(sceneSize);
    }

    update = () => {
        const boidsLen = this.boidsGroup.children.length;
        for (let i = 0; i < boidsLen; i++) {
            this.boidsGroup.children[i].update(this.boidsGroup.children);
        }
    }

}





function init() {
    const boidsRenderer = new BoidsRenderer("3D");
    const boids = new Boids();
    boids.createRandom3D(400);

    boidsRenderer.scene.add(boids.boidsGroup);

    const cameraController = addCameraControlls(boidsRenderer);

    /* set move speed to something reasonable in range of the boids movement speed*/

    const boidSpeed = boids.boidsGroup.children[0].maxSpeed;

    console.log(boidSpeed)

    cameraController.movementSpeed = boidSpeed;
    cameraController.rollSpeed = 0.002;

    if (boidsRenderer.camera.isOrthographicCamera) {
        boidsRenderer.updateFunction = () => {
            boids.update();
        }
    } else {
        boidsRenderer.updateFunction = (delta) => {
            boids.update();
            boidsRenderer.camera.lookAt(boids.getCenter())
            //cameraController.update(delta);
        };
    }


    /* boids.createRandom(); */
    boidsRenderer.start();
}


class App {
    constructor() {
        this.renderer = new BoidsRenderer("3D");
        this.boids = new Boids();
        this.count = 400;
        this.mode = "3D";
        this.cemeraMode = "lookAt";

        optionsOpen = false;
    }

}

init();

function addCameraControlls(boidsRenderer) {
    if (boidsRenderer.camera.isOrthographicCamera) {
        return console.warn("can only add camera controlls to a non orthographic camera. Please switch to 3d mode")
    }

    return new FlyControlls(boidsRenderer.camera, boidsRenderer.renderer.domElement)
}