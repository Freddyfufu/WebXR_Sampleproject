// Beispielanwendung WebXR im Rahmen der Bachelorarbeit von Freddy Oexemann

import * as THREE from "three";

export const shaderHighlightActiveQuiz = new THREE.ShaderMaterial({
    uniforms: {
        glowColor: {value: new THREE.Color(0x00ff00)}, // Highlight-Farbe
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
            float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(glowColor, intensity);
        }
    `,
    side: THREE.FrontSide,
    transparent: true,
});

export const highlightShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        glowColor: {value: new THREE.Color(0xff0000)}, // Startfarbe
        time: {value: 0}, // Zeit für die Animation
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 glowColor;
        uniform float time;
        void main() {
            float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            intensity += 0.5 * sin(time * 3.0) + 0.5; // Pulsierende Animation

            // Farbwechsel basierend auf Position und Zeit
            vec3 dynamicColor = glowColor * (0.5 + 0.5 * sin(time + vPosition.x * 2.0));
            
            // Endfarbe mit animierter Intensität
            gl_FragColor = vec4(dynamicColor, intensity);
        }
    `,
    side: THREE.FrontSide,
    transparent: true,
})