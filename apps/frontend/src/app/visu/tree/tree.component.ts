import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { Led, Point } from '@xmas-leds/api-interfaces';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PointsService } from '../../points/points.service';
import { AnimationService } from '../animation/animation.service';

@Component({
  selector: 'xmas-leds-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('canvas')
  private canvasRef: ElementRef | undefined;

  @Input() public points: Point[] = [];

  private cameraX = 100;
  private cameraY = 20;
  private cameraZ = 50;
  private fieldOfView = 1;
  private nearClippingPlane = 1;
  private farClippingPlane = 1000;

  private camera!: THREE.PerspectiveCamera;
  private leds: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[] = [];
  private controls: OrbitControls | undefined;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;

  /**
   * Animate the tree
   *
   * @private
   * @memberof CubeComponent
   */
  private animateScene() {
    this.controls?.update();
  }

  /**
   * Create the scene
   *
   * @private
   * @memberof CubeComponent
   */
  private createScene() {
    // console.log('createScene');

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0.5, 0.5, 0.5);

    // axes
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // rendere
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    // Camera
    const aspectRatio = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.fieldOfView, aspectRatio, this.nearClippingPlane, this.farClippingPlane);
    this.camera.up = new THREE.Vector3(0, 0, 1);
    this.camera.position.set(this.cameraX, this.cameraY, this.cameraZ);

    // orbit control
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.listenToKeyEvents(window); // optional
    this.controls.autoRotate = true;
    this.controls.enableDamping = true;
  }

  /**
   * Start the rendering loop
   */
  private startRenderingLoop() {
    this.render();
  }
  render() {
    requestAnimationFrame(() => {
      this.render();
    });
    this.animateScene();
    this.renderer.render(this.scene, this.camera);
  }

  constructor(private pointsService: PointsService, private animationService: AnimationService) {}

  ngOnChanges(): void {
    if (this.points.length > 0) {
      // change the Camera
      const maxZ = this.points.reduce((p, c) => (p > c.z ? p : c.z), -Infinity);
      // console.log(maxZ);
      this.camera.lookAt(0, 0, maxZ * 0.4);
      this.camera.fov = 2 * Math.atan(maxZ / (2 * 80)) * (180 / Math.PI);
      this.camera.updateProjectionMatrix();

      if (this.controls) {
        this.controls.target = new THREE.Vector3(0, 0, maxZ * 0.4);
      }
      this.controls?.update();

      // Add the points
      this.points.forEach((p) => {
        const geometry = new THREE.BufferGeometry();
        const particle = [p.x, p.y, p.z];
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particle), 3));

        const material = new THREE.PointsMaterial({
          size: 1,
          color: 0x000000,
          // transparent: true,
          // depthTest: false,
          // sizeAttenuation: true,
          opacity: 1,
        });

        const led = new THREE.Points(geometry, material);
        this.scene.add(led);
        this.leds.push(led);
      });
    }
  }

  ngOnInit() {
    this.animationService.changingColor.subscribe((l) => {
      if (l.index < this.leds.length) {
        if (l.r === 0 && l.g === 0 && l.b === 0) {
          this.leds[l.index].material.size = 1;
        } else {
          this.leds[l.index].material.size = 2;
        }
        this.leds[l.index].material.color = new THREE.Color(l.r / 255, l.g / 255, l.b / 255);
      }

    });
  }
  ngAfterViewInit() {
    this.createScene();
    this.startRenderingLoop();
  }
}
