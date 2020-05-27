import * as THREE from './three.module.js';
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
        this.type = "2D";
        this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / -2, window.innerHeight / 2, 1, 1000)

    }
    setMode3d = () => {
        if (!this.camera.isOrthographicCamera) return
        this.type = "3D";
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
        /* accelerationVector: new THREE.Vector3(),
        velocityVector: new THREE.Vector3(), */
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

        this.options = options;
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


    clearBoids = () => {
        this.boidsGroup = new THREE.Group();
    }

    static minScreen = () => {
        // returns the smaller dimension of the container currently the window
        return window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    }

    createRandom = (count = 60, type = "3D") => {
        this.clearBoids();
        if (type === "2D") {
            for (let i = 0; i < count; i++) {
                const posXScreenRange = (Math.random() - 0.5) * window.innerWidth;
                const posYScreenRange = (Math.random() - 0.5) * window.innerHeight;
                this.createBoid2D(posXScreenRange, posYScreenRange);
            }
        } else {
            for (let i = 0; i < count; i++) {
                this.createBoid3D(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            }

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
    optionsContainer;
    cameraController;
    cameraButton;
    numInputs = {};
    constructor() {
        this.renderer = new BoidsRenderer("3D");
        this.boids = new Boids();
        this.count = 400;
        this.mode = "3D";
        this.cameraMode = "lookAt";

        this.setCameraDefault();

        this.optionsOpen = false;
        this.running = false;
        this.boidsReady = false;

        // save initial options for the case that you want to restore them and not reload the page
        this.initialBoidsOptions = {
            ...this.boids.options
        }

        this.initialCameraPos = this.renderer.camera.position.clone();

        this.createDOMControlls();
    }

    createDOMControlls = () => {
        /* add event listeners to the dom elements */
        this.optionsContainer = document.querySelector('#optionsContainer')
        const toggle = document.querySelector("#optionsToggle");

        toggle.addEventListener('click', (e) => {
            this.optionsContainer.classList.toggle('open')
        })

        this.createButtonControlls();

        this.createOptionsInputs();

    }

    resetOptions3d = () => {
        /* reset boids options */
        this.boids.options = {
            ...this.initialBoidsOptions
        };
        /* rest renderer camera position */
        this.renderer.camera.position.copy(this.initialCameraPos);
        this.setCameraDefault();
    }

    resetOptions2d = () => {
        this.boids.options = {
            ...this.boids2dDefaultValues
        };

    }

    createButtonControlls = () => {
        document.querySelector('#startStopButton').addEventListener('click', (e) => {
            this.stopStart();
            e.target.innerHTML = this.running ? "STOP" : "START";
        })

        document.querySelector('#resetButton').addEventListener('click', (e) => {
            /* reset boids options */
            this.mode == "2d" ? this.resetOptions2d() : this.resetOptions3d();
            /* update inputs */
            this.setNumInputs();
        })

        document.querySelector('#button2D').addEventListener('click', (e) => {
            this.setMode2D();
        })

        document.querySelector('#button3D').addEventListener('click', (e) => {
            this.setMode3D();
        })
        this.cameraButton = document.querySelector('#freeCamera')
        this.cameraButton.addEventListener('click', (e) => {
            if (this.mode === "2d") return;
            if (this.cameraMode === "lookAt") {
                this.setCameraFree();
            } else {
                this.setCameraDefault();
            }
        })
    }

    updateCameraButton = () => {
        if (!this.cameraButton) return;
        if (this.mode === "2D") {
            this.cameraButton.disabled = true;
        } else {
            this.cameraButton.disabled = false;
            this.cameraButton.innerHTML = this.cameraMode === "lookAt" ? "Free Camera" : "Follow Camera";

        }
    }

    createOptionsInputs = () => {
        const content = document.querySelector('#optionsContent');
        for (const key in this.boids.options) {
            /* create input label */
            const label = document.createElement('label');
            label.innerHTML = key;

            content.appendChild(label);

            /* create input */
            const node = document.createElement('input')
            node.type = 'number'
            node.id = `${key}_input`
            node.classList = "numOptions"
            node.value = this.boids.options[key]
            node.addEventListener('input', (e) => {
                console.log(e);

                this.boids.options[key] = e.target.value || 0;
            })

            content.appendChild(node);

            this.numInputs[key] = node;
        }
    }



    setCameraFree = () => {
        if (this.mode === "2D") return;
        this.cameraController = addCameraControlls(this.renderer);
        const boidSpeed = this.boids.options.maxSpeed;
        this.cameraController.movementSpeed = boidSpeed;
        this.cameraController.rollSpeed = 0.002;
        this.cameraController.dragToLook = true;

        this.renderer.updateFunction = (delta) => {
            this.boids.update();
            this.cameraController.update(delta);
        };
        this.cameraMode = "free";
        this.mode = "3D";
        alert("hold right click to look around and WASD to move")

        this.updateCameraButton();
    }

    setCameraDefault = () => {
        if (this.mode === "2D") return;
        this.renderer.updateFunction = () => {
            this.boids.update();
            this.renderer.camera.lookAt(this.boids.getCenter())
        };
        this.cameraMode = "lookAt";
        this.mode = "3D";

        this.updateCameraButton();
    }

    setMode2D = () => {
        if (this.mode === "2D") return;
        this.stop();
        this.renderer.setMode2d();
        this.mode = "2D";
        this.boidsReady = false;
        /* after switching mode create new boids */

        if (this.renderer.camera.isOrthographicCamera) {
            this.renderer.updateFunction = () => {
                this.boids.update();
            }
            this.start();
        }

        this.updateCameraButton();
    }

    setMode3D = () => {
        if (this.mode === "3D") return;
        this.stop();
        this.renderer.setMode3d();
        this.mode = "3D";
        this.boidsReady = false;
        /* after switching mode create new boids */
        this.setCameraDefault();
        this.start();
    }

    createBoids = () => {
        this.renderer.scene.remove(this.boids.boidsGroup);
        this.mode === "2D" ? (
                this.boids.createRandom2D(this.count),
                // 2d renderer has a way different dimensions of the view so options need to be adjusted
                this.boids.options = {
                    ...boids2dDefaultValues
                }
            ) :
            (
                this.boids.createRandom3D(this.count),
                this.boids.options = {
                    ...this.initialBoidsOptions
                }
            );
        this.renderer.scene.add(this.boids.boidsGroup);
        this.boidsReady = true;
        this.setNumInputs();
    }

    setNumInputs = () => {
        // sync the options with the dom values
        for (const key in this.numInputs) {
            this.numInputs[key].value = this.boids.options[key];
        }
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

const boids2dDefaultValues = {
    maxForce: 0.20,
    maxSpeed: 1.6,
    seperationDist: 5.1,
    allignDist: 40,
    cohesionDist: 40,
    homeDist: Boids.minScreen(),
    seperationWeight: 1.5,
    allignmentWeight: 1.1,
    cohesionWeight: 1.0,
    homeWeight: 1.1
}

function addCameraControlls(boidsRenderer) {
    if (boidsRenderer.camera.isOrthographicCamera) {
        return console.warn("can only add camera controlls to a non orthographic camera. Please switch to 3d mode")
    }

    return new FlyControlls(boidsRenderer.camera, boidsRenderer.renderer.domElement)
}


const myApp = new App();
myApp.start();