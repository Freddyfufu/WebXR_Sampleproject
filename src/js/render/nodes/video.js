import * as THREE from 'three';

class VideoMaterial {
  constructor(videoTexture, displayMode = 'mono') {
    this.videoTexture = videoTexture;
    this.uniforms = {
      diffuse: { value: videoTexture },
      texCoordScaleOffset: { value: this.getTexCoordScaleOffset(displayMode) }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexSource(),
      fragmentShader: this.fragmentSource()
    });
  }

  getTexCoordScaleOffset(displayMode) {
    switch (displayMode) {
      case 'stereoTopBottom':
        return [1.0, 0.5, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5];
      case 'stereoLeftRight':
        return [0.5, 1.0, 0.0, 0.0, 0.5, 1.0, 0.5, 0.0];
      default: // mono
        return [1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0];
    }
  }

  vertexSource() {
    return `
      uniform vec4 texCoordScaleOffset[2];
      attribute vec2 uv;
      varying vec2 vTexCoord;

      void main() {
        vec4 scaleOffset = texCoordScaleOffset[0];
        vTexCoord = (uv * scaleOffset.xy) + scaleOffset.zw;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  fragmentSource() {
    return `
      uniform sampler2D diffuse;
      varying vec2 vTexCoord;

      void main() {
        gl_FragColor = texture2D(diffuse, vTexCoord);
      }
    `;
  }

  getMaterial() {
    return this.material;
  }
}

class VideoNode {
  constructor({ video, displayMode = 'mono', width = 1.0, height = 0.5 }) {
    this.video = video;
    this.displayMode = displayMode;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    const videoMaterial = new VideoMaterial(videoTexture, displayMode);

    const geometry = new THREE.PlaneGeometry(width, height);
    this.mesh = new THREE.Mesh(geometry, videoMaterial.getMaterial());
  }

  getMesh() {
    return this.mesh;
  }
}

// // Example usage
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer();
//
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
//
// // Set up the video
// const video = document.createElement('video');
// video.src = './path/to/your/video.mp4';
// video.crossOrigin = 'anonymous';
// video.loop = true;
// video.muted = true;
// video.play();
//
// // Create the video node
// const videoNode = new VideoNode({ video, displayMode: 'mono', width: 2, height: 1 });
// scene.add(videoNode.getMesh());
//
// // Position the camera
// camera.position.z = 3;
//
// function animate() {
//   requestAnimationFrame(animate);
//   renderer.render(scene, camera);
// }
//
// animate();
