import * as THREE from 'three';

// シーン作成
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// アイソメトリックカメラ設定
const aspect = window.innerWidth / window.innerHeight;
const d = 20;
const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  1,
  1000
);

// アイソメトリック角度に設定
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);

// レンダラー設定
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// 素材
const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xf9f7f1 });
const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
const roadMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });

// 道路
const road = new THREE.Mesh(new THREE.BoxGeometry(50, 0.2, 10), roadMaterial);
road.position.y = -0.1;
scene.add(road);

// 建物を配置する関数
function addBuilding(x, z, width, height, depth) {
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    buildingMaterial
  );
  building.position.set(x, height / 2, z);
  scene.add(building);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.98, 0.3, depth * 0.98),
    roofMaterial
  );
  roof.position.set(x, height + 0.15, z);
  scene.add(roof);
}

// 建物をいくつか追加
addBuilding(-10, -5, 4, 8, 4);
addBuilding(-4, -4, 3, 5, 3);
addBuilding(2, -5, 5, 10, 5);
addBuilding(10, -4, 4, 6, 4);
addBuilding(5, 4, 4, 7, 4);

// レンダリングループ
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

// リサイズ対応
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
