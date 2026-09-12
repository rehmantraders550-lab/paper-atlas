import * as THREE from 'three';

export interface KinematicNode {
  faceIndex: number;
  parentIndex: number; // -1 for root
  foldAxis: [number, number, number];
  foldOrigin: [number, number, number];
  angleMultiplier: number; 
}

export interface PatternData {
  name: string;
  nodes: number;
  faces: number[][];
  flat: number[];
  folded?: number[];
  kinematicTree?: KinematicNode[];
}

export class OrigamiEngine {
  public geometry: THREE.BufferGeometry;
  private flatPositions: Float32Array;
  private foldedPositions: Float32Array | null = null;
  private currentPositions: Float32Array;
  private kinematicTree: KinematicNode[] | undefined;
  private faces: number[][];

  constructor(patternData: PatternData) {
    this.geometry = new THREE.BufferGeometry();
    this.kinematicTree = patternData.kinematicTree;
    this.faces = patternData.faces;
    
    const faceCount = patternData.faces.length;
    this.flatPositions = new Float32Array(faceCount * 9);
    this.currentPositions = new Float32Array(faceCount * 9);

    if (patternData.folded) {
      this.foldedPositions = new Float32Array(faceCount * 9);
    }

    let idx = 0;
    for (const face of patternData.faces) {
      for (let i = 0; i < 3; i++) {
        const vIdx = face[i];
        
        this.flatPositions[idx] = patternData.flat[vIdx * 3];
        this.flatPositions[idx+1] = patternData.flat[vIdx * 3 + 1];
        this.flatPositions[idx+2] = patternData.flat[vIdx * 3 + 2];
        
        if (patternData.folded && this.foldedPositions) {
          this.foldedPositions[idx] = patternData.folded[vIdx * 3];
          this.foldedPositions[idx+1] = patternData.folded[vIdx * 3 + 1];
          this.foldedPositions[idx+2] = patternData.folded[vIdx * 3 + 2];
        }
        
        idx += 3;
      }
    }

    this.currentPositions.set(this.flatPositions);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
    this.geometry.computeVertexNormals();
  }

  public getMesh(): THREE.Mesh {
    return new THREE.Mesh(this.geometry);
  }

  public updateGeometry(foldAngle: number): void {
    if (this.kinematicTree) {
      // Kinematic Quaternion approach
      const angleRad = THREE.MathUtils.degToRad(foldAngle);
      const faceTransforms = new Map<number, THREE.Matrix4>();
      
      for (const node of this.kinematicTree) {
        const transform = new THREE.Matrix4();
        
        if (node.parentIndex !== -1) {
          const parentTransform = faceTransforms.get(node.parentIndex) || new THREE.Matrix4();
          
          const axis = new THREE.Vector3(...node.foldAxis).normalize();
          const origin = new THREE.Vector3(...node.foldOrigin);
          const localAngle = angleRad * node.angleMultiplier;
          const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, localAngle);
          
          const t1 = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);
          const r = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
          const t2 = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z);
          
          const localTransform = new THREE.Matrix4().multiply(t2).multiply(r).multiply(t1);
          transform.multiplyMatrices(parentTransform, localTransform);
        }
        
        faceTransforms.set(node.faceIndex, transform);
      }

      const vertex = new THREE.Vector3();
      let idx = 0;
      
      for (let f = 0; f < this.faces.length; f++) {
        const transform = faceTransforms.get(f) || new THREE.Matrix4();
        
        for (let i = 0; i < 3; i++) {
          vertex.set(
            this.flatPositions[idx],
            this.flatPositions[idx+1],
            this.flatPositions[idx+2]
          );
          
          vertex.applyMatrix4(transform);
          
          this.currentPositions[idx] = vertex.x;
          this.currentPositions[idx+1] = vertex.y;
          this.currentPositions[idx+2] = vertex.z;
          idx += 3;
        }
      }
    } else if (this.foldedPositions) {
      // Fallback to Linear Interpolation if no kinematic tree is provided
      const t = Math.max(0, Math.min(1, foldAngle / 180));
      for (let i = 0; i < this.currentPositions.length; i++) {
        this.currentPositions[i] = this.flatPositions[i] + (this.foldedPositions[i] - this.flatPositions[i]) * t;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
