// vrSession.js
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { renderer, scene, camera } from './scene.js';
import {controller1, controller2, controllerGrip1, controllerGrip2, setupControllers} from './controllers.js';
import * as ThreeMeshUI from "three-mesh-ui";
import * as THREE from "three";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";





import { io } from 'socket.io-client';
export let socket,mysession, referenceSpace, dolly,reticleGeometry,reticleMaterial,reticle, isVideoPlaying = false,playButtonMaterial, video,playTexture,playButtonGeometry, videoMesh,videoTexture, playButtonMesh, videoMaterial, videoGeometry;
let mixer;
let otherPlayers = {};
const fbxLoader = new FBXLoader();
const ipv4 = "192.168.137.1";



function updateArms(leftArm, rightArm) {
    // const armOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); // Offset für die Arme
    if (controller1) {
        // Beispiel: Übertrage die Controller-Rotation auf den linken Arm
        if (leftArm) {
            leftArm.quaternion.copy(controller1.quaternion);
        }
    }

    if (controller2) {
        // Beispiel: Übertrage die Controller-Rotation auf den rechten Arm
        if (rightArm) {
            rightArm.quaternion.copy(controller2.quaternion);
        }

    }
}



function onSessionStart(session) {
    mysession = session;
    console.log('Session started');
    setupControllers(scene, renderer);

    dolly = new THREE.Group();
    dolly.add(controller1);
    dolly.add(controller2);
    dolly.add(camera); // Füge die Kamera hinzu
    dolly.add(controllerGrip1);
    dolly.add(controllerGrip2)
    scene.add(dolly);
    // lade eigenen Avatar
    fbxLoader.load('assets/Idle.fbx', (object) => {
        object.scale.set(0.01, 0.01, 0.01);

        object.rotation.set(0, Math.PI, 0);

        // Finde den Armknochen
        dolly.leftArm = object.getObjectByName('mixamorig1LeftArm');
        dolly.rightArm = object.getObjectByName('mixamorig1RightArm');

        if (dolly.rightArm && dolly.leftArm) {
            console.log('Left Arm Bone:', dolly.leftArm);
            console.log('Right Arm Bone:', dolly.rightArm);
        }


        dolly.add(object);
        mixer = new THREE.AnimationMixer(object);
        const action = mixer.clipAction(object.animations[0]);
        action.play();
        console.log('Dolly loaded:', dolly);
    });

    socket.emit('player_added', { dolly: dolly});
    // Create a video element
    video = document.createElement('video');
    video.loop = true;
    video.src = '/assets/media/video/gn.mkv';
    video.crossOrigin = 'anonymous';
    video.muted = false;
    video.playsInline = true;
    video.load();
    video.name = 'video';

    reticleGeometry = new THREE.RingGeometry(0.1, 0.15, 32); // Ring für das Reticle
    reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Gelbes Material
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.rotation.x = -Math.PI / 2; // Flach auf den Boden legen
    reticle.visible = false; // Standardmäßig unsichtbar
    scene.add(reticle);

    scene.background = new THREE.Color(0x808080);

    // Handle browser resize
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Create a texture from the video
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    // Create a play button texture
     playTexture = new THREE.TextureLoader().load('/assets/media/textures/play-button.png');

// Create a plane for the play button
     playButtonGeometry = new THREE.PlaneGeometry(0.5, 0.5);
     playButtonMaterial = new THREE.MeshBasicMaterial({
        map: playTexture,
        transparent: true,
    });
     playButtonMesh = new THREE.Mesh(playButtonGeometry, playButtonMaterial);
    playButtonMesh.name = 'playButton';

// Position and scale the play button
    playButtonMesh.position.set(0.025, 0.275, -4.2);
    playButtonMesh.scale.set(0.5, 0.5, 0.5);
    scene.add(playButtonMesh);

    // Create a material for the video plane
    videoMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
        side: THREE.FrontSide,
    });
    videoMaterial.name = 'videoMaterial';

// Create a plane geometry for the video screen
    videoGeometry = new THREE.PlaneGeometry(2.1, 1.1);
    videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    videoMesh.name = 'videoMesh';

// Position the video mesh
    videoMesh.position.set(0.020, 1.723, -3.8);
    scene.add(videoMesh);

    // Adjust the aspect ratio of the video plane after the video loads
    video.addEventListener('loadeddata', () => {
        let aspect = video.videoWidth / video.videoHeight;
        if (aspect < 2.0) {
            videoMesh.scale.set(aspect * 1.1, 2.1, 1.0);
        } else {
            videoMesh.scale.set(2.1, 2.1 / aspect, 1.0);
        }
    });


    const colliderGeometry = new THREE.PlaneGeometry(100, 100);
    const colliderMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Unsichtbares Material
    const groundCollider = new THREE.Mesh(colliderGeometry, colliderMaterial);

    groundCollider.rotation.x = -Math.PI / 2; // Liegt flach auf dem Boden
    scene.add(groundCollider);
    // Rufe regelmäßig `sendPlayerPosition` auf, um die eigene Position zu senden
    setInterval(sendCharacterState, 100);

    renderer.setAnimationLoop(render);
}

export function onSessionEnd() {
    console.log('Session ended');
    renderer.xr.setSession(null); // Detach the session
    document.body.classList.remove('xr-active');
    // remove all player models
    for (let player in otherPlayers) {
        scene.remove(otherPlayers[player]);
    }
    // remove self
    scene.remove(dolly);
    otherPlayers = {};
    mysession = null;
}

export function onSelectStart(event) {
    referenceSpace = VRButton.referenceSpace;
    induceControllerRay(controller1);
}

function onSelectEnd(event) {
    referenceSpace = VRButton.referenceSpace;
}



export function initVR() {
    console.log('initVR');
    const sessionOptions = {
        requiredFeatures: ['local'],
        optionalFeatures: ['hand-tracking'],
        domOverlay: { root: document.body }
    };
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr')
            .then((supported) => {
                if (supported) {
                    console.log('VR wird unterstützt');
                    socket = io.connect('https://' + ipv4 + ':3000');

                    socket.on('connect', () => {
                        console.log('Verbunden mit dem WebSocket-Server!');
                    });
                    socket.on('add_player', (new_player, all_players) => {
                        if (new_player.id === socket.id) return;
                        console.log('Other players:', otherPlayers);

                        // Erstelle einen neuen Avatar für den Spieler
                        const otherPlayerGroup = new THREE.Group();

                        // Lade das FBX-Modell für den Spieler
                        fbxLoader.load('assets/Idle.fbx', (object) => {
                            object.scale.set(0.01, 0.01, 0.01);
                            object.rotation.set(0, Math.PI, 0);
                            otherPlayerGroup.leftArm = object.getObjectByName('mixamorig1LeftArm');
                            otherPlayerGroup.rightArm = object.getObjectByName('mixamorig1RightArm');
                            // Füge das Modell zur Gruppe hinzu
                            otherPlayerGroup.add(object);

                            // Setze die anfängliche Position und Rotation basierend auf den empfangenen Daten
                            otherPlayerGroup.position.set(0, 0, 0);

                            // Füge den Spieler zur Szene hinzu
                            scene.add(otherPlayerGroup);

                            console.log(`Player ${new_player.id} added to the scene.`);
                        });

                        // Speichere die Gruppe im `otherPlayers`-Objekt
                        otherPlayers[new_player.id] = otherPlayerGroup;
                    });

                    /*
                    {
                    id: socket.id,
                    state: {
                    animation: currentAnimation,
                    arms: armRotations,
                    rotation: rotation,
                    }
                    }
                    * */
                    socket.on("update_character", (data) => {
                        if (otherPlayers[data.id] && data.id !== socket.id) {
                        console.log('Update position clientside NON SELF:', data);
                            otherPlayers[data.id].position.copy(data.state.position);
                            otherPlayers[data.id].rotation.set(data.state.rotation.x, data.state.rotation.y, data.state.rotation.z);
                            otherPlayers[data.id].currentAnimationName = data.state.animation;
                            console.log('Update rotation clientside:', data.state.rotation);
                            if (data.state.arms.leftArm) {
                                otherPlayers[data.id].leftArm.rotation.fromArray(data.state.arms.leftArm);
                            }
                            if (data.state.arms.rightArm) {
                                otherPlayers[data.id].rightArm.rotation.fromArray(data.state.arms.rightArm);
                            }



                        }
                    });

                    socket.on("remove_player", (socket_id) => {
                        scene.remove(otherPlayers[socket_id]);
                        delete otherPlayers[socket_id];
                        console.log('Removed player:', socket_id);
                    });

                    socket.on('initialize_players', (players) => {
                        console.log('initialize_players:', players);
                        players.forEach(player => {
                            if (player.id === socket.id) return;
                            const otherPlayerGroup = new THREE.Group();
                            fbxLoader.load('assets/Idle.fbx', (object) => {
                                object.scale.set(0.01, 0.01, 0.01);
                                object.rotation.set(0, Math.PI, 0);
                                otherPlayerGroup.leftArm = object.getObjectByName('mixamorig1LeftArm');
                                otherPlayerGroup.rightArm = object.getObjectByName('mixamorig1RightArm');
                                otherPlayerGroup.add(object);
                                otherPlayerGroup.position.set(0, 0, 0);
                                scene.add(otherPlayerGroup);
                            });
                            otherPlayers[player.id] = otherPlayerGroup;
                        });
                    });

                    const btnDict = VRButton.createButton(renderer, sessionOptions, onSelectStart, onSelectEnd, onSessionStart, onSessionEnd);
                    document.body.appendChild(btnDict.button);
                    referenceSpace = btnDict.referenceSpace;
                }
            });
    }


}

function render(time) {
    if (mixer)
    mixer.update(0.016); // 16ms für eine 60FPS-Rate
    try {
        if (dolly.leftArm && dolly.rightArm)
        updateArms(dolly.leftArm, dolly.rightArm);
    }
    catch (e) {
        console.log(e);
    }

    try {
        let thumpstick_axes =  controller1.userData.inputSource.gamepad.axes
        if (thumpstick_axes[3] > 0.5) {
            dolly.translateZ(0.1);
        }
        if (thumpstick_axes[3] < -0.5) {
            dolly.translateZ(-0.1);
        }
        if (thumpstick_axes[2] > 0.5) {
            dolly.rotateY(-0.05);
        }
        if (thumpstick_axes[2] < -0.5) {
            dolly.rotateY(0.05);
        }
    }
    catch (e) {
        console.log(e);
    }
    ThreeMeshUI.update();

    renderer.render(scene, camera);
}

function induceControllerRay(controller) {
  if (!controller) {
        console.error('Controller ist nicht definiert');
        return;
    }
    const line = controller.getObjectByName('ray');
    if (!line) {
        console.error('Ray ist nicht definiert');
        return;
    }
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    let raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);


    // Prüfe auf Treffer
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        line.material.color.set(0xffff00); // Strahl färben
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === videoMesh) {
                toggleVideoPlayback(); // Video abspielen oder pausieren
            }
            else if(intersects[i].object.name === "MyGround"){ // Wenn der Boden getroffen wurde ...
                reticle.position.copy(intersects[i].point);
                reticle.position.y = 0.01; // Etwas über dem Boden
                reticle.visible = true; // Zeige das Reticle an
                dolly.position.copy(reticle.position);
                dolly.updateMatrixWorld(true);
            }}
    }
    else {
        reticle.visible = false; // Verstecke das Reticle
    }

}

function toggleVideoPlayback() {
    if (!isVideoPlaying) {
        video.play();
        playButtonMesh.visible = false;
        isVideoPlaying = true;
    } else {
        video.pause();
        playButtonMesh.visible = true;
        isVideoPlaying = false;
    }
}

function getCharacterState() {
    if (!dolly) {
        console.warn('Dolly ist nicht definiert!');
        return;
    }

    // Holen der aktuellen Animation
    const currentAnimation = dolly.currentAnimationName || 'Idle';

    // Holen der Rotationen der Arme
    const armRotations = {
        leftArm: dolly.leftArm ? dolly.leftArm.rotation.toArray() : null,
        rightArm: dolly.rightArm ? dolly.rightArm.rotation.toArray() : null,
    };

    const rotation = {
        x: dolly.rotation.x,
        y: dolly.rotation.y,
        z: dolly.rotation.z,
    }

    const position = {
        x: dolly.position.x,
        y: dolly.position.y,
        z: dolly.position.z,
    }

    return {
        animation: currentAnimation,
        arms: armRotations,
        rotation: rotation,
        position: position,
    };
}



function sendCharacterState() {
    const characterState = getCharacterState();

    // Sende die Daten an den Server
    socket.emit('update_character', {
        id: socket.id, // Spieler-ID
        state: characterState,
    });
}


