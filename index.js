import * as THREE from './node_modules/three/build/three.module.js';



class BoidsRenderer {
    updateFunction;
    constructor() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 300);
        this.camera.position.z = 20;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderContainer = document.getElementById('renderContainer');
        this.resize();
        this.renderContainer.appendChild(this.renderer.domElement)
        window.addEventListener("resize", this.resize)
    }


    resize = () => {
        this.camera.aspect = this.renderContainer.clientWidth / this.renderContainer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.renderContainer.clientWidth, this.renderContainer.clientHeight);

    }


    start = () => {
        console.log(this.scene)
        if (this.scene.children.length) {
            if (this.updateFunction) return this.runWithUpdate()
            this.run();
        }

    }

    run = () => {
        requestAnimationFrame(this.run);
        this.render();
    }

    runWithUpdate = () => {
        requestAnimationFrame(this.runWithUpdate);
        this.updateFunction();
        this.render();
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
        this.boids = new THREE.Group();

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
        this.boids.add(boid);
        return this.boids;
    }


    createBoid = (posX = 0, posY = 0, posZ = 0) => {
        const geometry = new THREE.ConeGeometry(1, 3, 5);
        const material = new THREE.MeshNormalMaterial();
        const mesh = new Boid(geometry, material);
        mesh.position.set(posX, posY, posZ);
        this.boids.add(mesh);
        return this.boids;
    }

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
        }) => 
    {
        /* loop over all boids and update their options */
        for(const boid of this.boids.children){
            boid.updateOptions(options);
        }
    }

    createRandom = (count = 60) => {
        for (let i = 0; i < count; i++) {
            this.createBoid(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }
        return this.boids;
    }

    getCenter = () => {
        const sceneSize = this.boids.children.length;
        let averagePos = new THREE.Vector3(0, 0, 0);
        if (!sceneSize) return averagePos;

        for (let i = 0; i < sceneSize; i++) {
            averagePos.add(this.boids.children[i].position);
        }
        return averagePos.divideScalar(sceneSize);
    }

    update = () => {
        const boidsLen = this.boids.children.length;
        for (let i = 0; i < boidsLen; i++) {
            this.boids.children[i].update(this.boids.children);
        }
    }

}

/* class Boids {

} */

class Boid extends THREE.Mesh {

    constructor(
        geometry = new THREE.ConeGeometry(1, 3, 5),
        material = new THREE.MeshNormalMaterial(),
        options = {
            acceleration: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            maxForce: 0.03,
            maxSpeed: 0.4,
            seperationDist: 1.1,
            allignDist: 10,
            cohesionDist: 10,
            homeDist: 200.0,
            seperationWeight: 1.5,
            allignmentWeight: 1.1,
            cohesionWeight: 1.0
        }
    ) {
        super(geometry, material); // create the actual mesh

        this.acceleration = options.acceleration;
        this.velocity = options.velocity;

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

    updateOptions = (
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
        /* if class has property you are allowed to replace it with updateOptions */
        for (const key in options) {
            if (this.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
    }


    update = (actors) => {
        this.boidBehavior(actors)
        this.applyForce();
        this.rotateMesh();
        this.updatePos();
        this.acceleration.set(0, 0, 0); // reset forces
    }

    rotateMesh = () => {
        this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.velocity.clone().normalize());
    }

    applyForce = () => {
        this.velocity.add(this.acceleration).clampLength(0, this.maxSpeed);
    }

    updatePos = () => {
        this.position.add(this.velocity);
    }

    boidBehavior = (actors) => {
        const [allignment, seperation, cohesion] = this.calcForces(actors);

        /* apply weights */
        seperation.multiplyScalar(this.seperationWeight);
        allignment.multiplyScalar(this.allignmentWeight);
        cohesion.multiplyScalar(this.cohesionWeight);

        /* update total force */
        this.acceleration.add(seperation);
        this.acceleration.add(allignment);
        this.acceleration.add(cohesion);

        /* apply extra force that returns boids to center eventually */
        if (this.position.length() > this.homeDist) {
            const homeForce = this.steerTo(new THREE.Vector3(0, 0, 0)).multiplyScalar(1.0);
            this.acceleration.sub(homeForce);
        }

    }

    steerTo = (target) => {
        const targetVec = new THREE.Vector3().subVectors(target, this.position);

        targetVec.setLength(this.maxSpeed);

        const steer = new THREE.Vector3().subVectors(this.velocity, targetVec);
        steer.clampLength(0, this.maxForce)
        return steer;
    }


    /* merge of of the 3 functions  to improve performance */
    calcForces = (otherActors) => {
        const seperationSum = new THREE.Vector3(0, 0, 0);
        const allignmentSum = new THREE.Vector3(0, 0, 0);
        const cohesionSum = new THREE.Vector3(0, 0, 0);

        let seperationCount = 0;
        let allignmentCount = 0;
        let cohesionCount = 0;

        const actorsLen = otherActors.length;

        for (let i = 0; i < actorsLen; i++) {
            /* get distance of current boid the the boid at pos i */
            const actorDist = this.position.distanceTo(otherActors[i].position);
            if (actorDist > 0) {
                /* sum up all velocity of all neighbors in a given distance  */
                if (actorDist < this.allignDist) {
                    allignmentSum.add(otherActors[i].velocity)
                    allignmentCount++;
                }
                /* sum up all POSITIONS of all neighbors in a given distance */
                if (actorDist < this.cohesionDist) {
                    cohesionSum.add(otherActors[i].position)
                    cohesionCount++;
                }
                /* sum up vetors pointing away from too close neighbors */
                if (actorDist < this.seperationDist) {
                    const vecDir = new THREE.Vector3().subVectors(this.position, otherActors[i].position);
                    vecDir.normalize()
                    vecDir.divideScalar(actorDist);
                    seperationSum.add(vecDir);
                    seperationCount++;
                }
            }

        }

        /* calc allignment force */
        if (allignmentCount > 0) {
            allignmentSum.divideScalar(allignmentCount);
            allignmentSum.setLength(this.maxSpeed);
            allignmentSum.sub(this.velocity);
            allignmentSum.clampLength(0, this.maxForce);
        } else allignmentSum.set(0, 0, 0);

        /* calc cohesion force */
        if (cohesionCount > 0) {
            cohesionSum.divideScalar(cohesionCount);
            cohesionSum.copy(this.steerTo(cohesionSum));
        }

        /* calc seperation force */
        if (seperationCount > 0) {
            seperationSum.divideScalar(seperationCount);
        }
        if (seperationSum.length() > 0) {
            seperationSum.setLength(this.maxSpeed);
            seperationSum.sub(this.velocity);
            seperationSum.clampLength(0, this.maxForce)
        }
        return [allignmentSum, cohesionSum, seperationSum];
    }




}

function init() {
    const boidsRenderer = new BoidsRenderer();
    const boids = new Boids();
    boids.createRandom(100);
    boidsRenderer.scene.add(boids.boids);
    boidsRenderer.updateFunction = () => {
        boids.update();
        boidsRenderer.camera.lookAt(boids.getCenter())
    };
    /* boids.createRandom(); */
    boidsRenderer.start();
}


init();