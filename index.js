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

        this.animationFrame = 0;
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
        if (this.scene.children.length) {
            if (this.updateFunction) {
                this.lastRender = Date.now();
                return this.runWithUpdate();
            }
            this.run();
        }
    }

    stop = () => {
        cancelAnimationFrame(this.animationFrame);
    }

    run = () => {
        this.animationFrame = requestAnimationFrame(this.run);
        this.render();
    }

    runWithUpdate = () => {
        this.animationFrame = requestAnimationFrame(this.runWithUpdate);
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
        cohesionWeight: 1.0,
        homeWeight: 1.1

    }) {
        this.boidsGroup = new THREE.Group();

        /* this.maxForce = options.maxForce;
        this.maxSpeed = options.maxSpeed;

        this.seperationDist = options.seperationDist;
        this.allignDist = options.allignDist;
        this.cohesionDist = options.cohesionDist;
        this.homeDist = options.homeDist;
        this.seperationWeight = options.seperationWeight;
        this.allignmentWeight = options.allignmentWeight;
        this.cohesionWeight = options.cohesionWeight; */
        this.options = options;
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


    createBoid = (posX = 0, posY = 0, posZ = 0, type = "3D") => {
        /* const geometry = new THREE.ConeGeometry(1, 3, 5); */
        const material = new THREE.MeshNormalMaterial();
        const mesh = type === "2D" ?
            new Boid2D(new THREE.ConeGeometry(8, 20, 5), material
                /* , {
                                ...this.options,
                                homeDist: this.minScreen()
                            } */
            ) :
            new Boid3D(new THREE.ConeGeometry(1, 3, 5), material /* , this.options */ );

        mesh.position.set(posX, posY, posZ);
        this.boidsGroup.add(mesh);
        return this.boidsGroup;
    }

    createBoid2D = (posX, posY) => this.createBoid(posX, posY, 0, "2D");


    createBoid3D = (posX, posY, posZ) => this.createBoid(posX, posY, posZ)

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

    static minScreen = () => {
        // returns the smaller dimension of the container currently the window
        return minScreen = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    }

    createRandom = (count = 60, type = "3D") => {
        this.clearBoids();
        if (type === "2D") {
            for (let i = 0; i < count; i++) {
                const posXScreenRange = (Math.random() - 0.5) * window.innerWidth;
                const posYScreenRange = (Math.random() - 0.5) * window.innerHeight;
                this.createBoid2D(posXScreenRange, posYScreenRange);
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
            this.boidsGroup.children[i].update(this.boidsGroup.children, this.options);
        }
    }

}



class App {
    optionsToggle;
    optionsContainer;
    constructor() {
        this.renderer = new BoidsRenderer("3D");
        this.boids = new Boids();
        this.count = 400;
        this.mode = "3D";
        this.cemeraMode = "lookAt";
        this.cameraController = addCameraControlls(this.renderer);

        this.setCameraDefault();

        this.optionsOpen = false;
        this.running = false;
        this.boidsReady = false;

        // save initial options for the case that you want to restore them and not reload the page
        this.initialBoidsOptions = {
            ...this.boids.options
        }


        this.createDOMControlls();
    }

    createDOMControlls = () => {
        this.optionsContainer = document.querySelector('#optionsContainer')
        this.optionsToggle = document.querySelector(".optionsToggle");

        this.optionsToggle.addEventListener('click', (e) => {
            this.optionsContainer.classList.toggle('open')
        })

        document.querySelector(".optionsContent").innerHTML = `
            <pre>
                ${JSON.stringify(this.initialBoidsOptions, null, 2)}
            </pre>
        `
    }



    setCameraFree = () => {
        if (this.mode === "2D") return;
        const boidSpeed = boids.boidsGroup.children[0].maxSpeed;
        this.cameraController.movementSpeed = boidSpeed;
        this.cameraController.rollSpeed = 0.002;
        this.renderer.updateFunction = (delta) => {
            boids.update();
            cameraController.update(delta);
        };
    }

    setCameraDefault = () => {
        if (this.mode === "2D") return;
        this.renderer.updateFunction = () => {
            this.boids.update();
            this.renderer.camera.lookAt(this.boids.getCenter())
        };

    }

    setMode2D = () => {
        if (this.mode === "2D") return;
        this.renderer.setMode2d;
        this.mode = "2D";
        this.boidsReady = false;
        /* after switching mode create new boids */

        if (this.renderer.camera.isOrthographicCamera) {
            this.renderer.updateFunction = () => {
                this.boids.update();
            }
        }


    }

    setMode3D = () => {
        if (this.mode === "3D") return;
        this.renderer.setMode3d;
        this.mode = "3D";
        this.boidsReady = false;
        /* after switching mode create new boids */
        if (boidsRenderer.camera.isOrthographicCamera) {
            boidsRenderer.updateFunction = () => {
                this.boids.update();
            }
        }
    }

    createBoids = () => {
        this.mode === "2D" ? this.boids.createRandom2D(this.count) : this.boids.createRandom3D(this.count);
        this.renderer.scene.add(this.boids.boidsGroup);
        this.boidsReady = true;
    }

    stop = () => {
        if (!this.running) return;
        this.renderer.stop();
        this.running = false;
    }

    start = () => {
        if (!this.boidsReady) this.createBoids();
        this.renderer.start();
        this.running = true;
    }

    stopStart = () => this.running ? this.stop() : this.start()

}



function addCameraControlls(boidsRenderer) {
    if (boidsRenderer.camera.isOrthographicCamera) {
        return console.warn("can only add camera controlls to a non orthographic camera. Please switch to 3d mode")
    }

    return new FlyControlls(boidsRenderer.camera, boidsRenderer.renderer.domElement)
}


const myApp = new App();
myApp.start();