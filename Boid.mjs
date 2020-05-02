import * as THREE from './node_modules/three/build/three.module.js';



export class Boid3D extends THREE.Mesh {

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
            homeDist: 400.0,
            seperationWeight: 1.5,
            allignmentWeight: 1.1,
            cohesionWeight: 1.0,
            homeWeight: 0.2
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
        this.homeWeight=options.homeWeight;
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
            const homeForce = this.steerTo(new THREE.Vector3(0, 0, 0)).multiplyScalar(this.homeWeight);
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

/* 
same like above just on vector2 you could of course extend that
 or do checks inside of update but i prefer some performance over space
*/

export class Boid2D extends THREE.Mesh {

    constructor(
        geometry = new THREE.ConeGeometry(1, 3, 5),
        material = new THREE.MeshNormalMaterial(),
        options = {
            acceleration: new THREE.Vector2(),
            velocity: new THREE.Vector2(),
            maxForce: 0.2,
            maxSpeed: 8,
            seperationDist: 24,
            allignDist: 100,
            cohesionDist: 100,
            homeDist: 200.0,
            seperationWeight: 1.5,
            allignmentWeight: 1.0,
            cohesionWeight: 1.0,
            homeWeight: 0.1
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
        this.homeWeight=options.homeWeight;
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
        this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(this.velocity.x, this.velocity.y, 0).normalize());
    }

    applyForce = () => {
        this.velocity.add(this.acceleration).clampLength(0, this.maxSpeed);
    }

    updatePos = () => {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
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
            const homeForce = this.steerTo(new THREE.Vector2(0, 0)).multiplyScalar(this.homeWeight);
            this.acceleration.sub(homeForce);
        }

    }

    steerTo = (target) => {
        const targetVec = new THREE.Vector2().subVectors(target, this.position);

        targetVec.setLength(this.maxSpeed);

        const steer = new THREE.Vector2().subVectors(this.velocity, targetVec);
        steer.clampLength(0, this.maxForce)
        return steer;
    }


    /* merge of of the 3 functions  to improve performance */
    calcForces = (otherActors) => {
        const seperationSum = new THREE.Vector2(0, 0);
        const allignmentSum = new THREE.Vector2(0, 0);
        const cohesionSum = new THREE.Vector2(0, 0);

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
                    const vecDir = new THREE.Vector2().subVectors(this.position, otherActors[i].position);
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