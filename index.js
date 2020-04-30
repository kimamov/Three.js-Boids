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

    /* init = () => {
        const boids = new Boids();
        boids.createRandom(30);
        console.log(boids)
        this.scene.add(boids.boids);
    } */

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
    constructor() {
        this.boids = new THREE.Group();
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
            accelerationVector: new THREE.Vector3(),
            velocityVector: new THREE.Vector3(),
            maxForce: 0.03,
            maxSpeed: 0.4,
            seperationDist: 1.1,
            allignDist: 10,
            homeDist: 200.0,
            seperationWeight: 1.5,
            allignmentWeight: 1.1,
            cohesionWeight: 1.0
        }
    ) {
        super(geometry, material); // create the actual mesh

        this.acceleration = options.accelerationVector;
        this.velocity = options.velocityVector;

        this.maxForce = options.maxForce;
        this.maxSpeed = options.maxSpeed;

        this.seperationDist = options.seperationDist;
        this.allignDist = options.allignDist;
        this.homeDist = options.homeDist;
        this.seperationWeight = options.seperationWeight;
        this.allignmentWeight = options.allignmentWeight;
        this.cohesionWeight = options.cohesionWeight;
    }
    update = (actors) => {
        this.boidBehavior(actors)
        this.applyForce();
        this.rotateMesh();
        this.updatePos();
        this.acceleration.set(0, 0, 0); // reset forces
    }

    rotateMesh=()=>{
        this.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), this.velocity.clone().normalize());
    }

    applyForce = () => {
        this.velocity.add(this.acceleration).clampLength(0, this.maxSpeed);
    }

    updatePos = () => {
        this.position.add(this.velocity);
    }

    boidBehavior = (actors) => {
        const seperation = this.seperation(actors);
        const allign = this.allignment(actors);
        const cohesion = this.cohesion(actors);

        seperation.multiplyScalar(this.seperationWeight);
        allign.multiplyScalar(this.allignmentWeight);
        cohesion.multiplyScalar(this.cohesionWeight);


        this.acceleration.add(seperation);
        this.acceleration.add(allign);
        this.acceleration.add(cohesion);

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

    dontLeaveWorld = (distance, treshhold) => {
        // apply force that prevents body from leaving a certain region most likely a sphere for now so distance from center should be fine
        const vecLen = this.position.length();
        if (vecLen > (distance - treshhold)) {
            return this.steerTo(new THREE.Vector3(0, 0, 0));
        }
    }

    seperation = (otherActors) => {
        // apply force that steers body away from others
        const steer = new THREE.Vector3(0, 0, 0);
        let closeActors = 0;

        const actorsLen = otherActors.length;

        for (let i = 0; i < actorsLen; i++) {
            const actorDist = this.position.distanceTo(otherActors[i].position);

            if (actorDist > 0 && actorDist < this.seperationDist) {
                const vecDir = new THREE.Vector3().subVectors(this.position, otherActors[i].position);
                vecDir.normalize()
                vecDir.divideScalar(actorDist);
                steer.add(vecDir);
                closeActors++;
            }
        }
        if (closeActors > 0) {
            steer.divideScalar(closeActors)

        }

        if (steer.length() > 0) {
            steer.setLength(this.maxSpeed);
            steer.sub(this.velocity);
            steer.clampLength(0, this.maxForce)
        }
        return steer;
    }

    allignment = (otherActors) => {
        const sum = new THREE.Vector3(0, 0, 0);

        let closeActors = 0;
        const actorsLen = otherActors.length;

        for (let i = 0; i < actorsLen; i++) {
            const actorDist = this.position.distanceTo(otherActors[i].position);
            if (actorDist > 0 && actorDist < this.allignDist) {
                sum.add(otherActors[i].velocity)
                closeActors++;
            }
        }
        if (closeActors > 0) {
            sum.divideScalar(closeActors);
            sum.setLength(this.maxSpeed);
            sum.sub(this.velocity);
            sum.clampLength(0, this.maxForce);
            return sum;
        } else return new THREE.Vector3(0, 0, 0);

    }

    cohesion = (otherActors) => {
        const sum = new THREE.Vector3(0, 0, 0);
        let closeActors = 0;
        const actorsLen = otherActors.length;

        for (let i = 0; i < actorsLen; i++) {
            const actorDist = this.position.distanceTo(otherActors[i].position);
            if (actorDist > 0 && actorDist < this.allignDist) {
                sum.add(otherActors[i].position)
                closeActors++;
            }
        }
        if (closeActors > 0) {
            sum.divideScalar(closeActors);
            /* console.log(sum) */
            return this.steerTo(sum);
        }
        return new THREE.Vector3(0, 0, 0);
    }






}

function init() {
    const boidsRenderer = new BoidsRenderer();
    const boids = new Boids();
    boids.createRandom(600);
    boidsRenderer.scene.add(boids.boids);
    boidsRenderer.updateFunction = () => {
        boids.update();
        boidsRenderer.camera.lookAt(boids.getCenter())
    };
    /* boids.createRandom(); */
    boidsRenderer.start();
}


init();