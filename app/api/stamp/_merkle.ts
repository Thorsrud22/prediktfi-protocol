import crypto from 'crypto';

/**
 * Simple Merkle tree implementation for batching insights
 */
export class MerkleTree {
  private leaves: string[];
  private tree: string[][];
  
  constructor(data: string[]) {
    this.leaves = data.map(item => this.hash(item));
    this.tree = this.buildTree();
  }
  
  private hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  private buildTree(): string[][] {
    if (this.leaves.length === 0) {
      throw new Error('Cannot build tree with no leaves');
    }
    
    const tree: string[][] = [this.leaves];
    let currentLevel = this.leaves;
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate if odd number
        const combined = left + right;
        nextLevel.push(this.hash(combined));
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }
    
    return tree;
  }
  
  getRoot(): string {
    if (this.tree.length === 0) {
      throw new Error('Tree is empty');
    }
    
    const lastLevel = this.tree[this.tree.length - 1];
    return lastLevel[0];
  }
  
  getProof(index: number): { hash: string; position: 'left' | 'right' }[] {
    if (index >= this.leaves.length) {
      throw new Error('Index out of bounds');
    }
    
    const proof: { hash: string; position: 'left' | 'right' }[] = [];
    let currentIndex = index;
    
    for (let level = 0; level < this.tree.length - 1; level++) {
      const currentLevel = this.tree[level];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < currentLevel.length) {
        proof.push({
          hash: currentLevel[siblingIndex],
          position: isRightNode ? 'left' : 'right'
        });
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof;
  }
  
  static verify(leaf: string, proof: { hash: string; position: 'left' | 'right' }[], root: string): boolean {
    let currentHash = crypto.createHash('sha256').update(leaf).digest('hex');
    
    for (const { hash: siblingHash, position } of proof) {
      const combined = position === 'left'
        ? siblingHash + currentHash
        : currentHash + siblingHash;
      currentHash = crypto.createHash('sha256').update(combined).digest('hex');
    }
    
    return currentHash === root;
  }
}

/**
 * Generate merkle root from insight IDs
 */
export function generateMerkleRoot(insightIds: string[]): string {
  if (insightIds.length === 0) {
    throw new Error('Cannot generate merkle root from empty array');
  }
  
  const tree = new MerkleTree(insightIds);
  return tree.getRoot();
}
