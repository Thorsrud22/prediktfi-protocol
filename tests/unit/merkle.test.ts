import { describe, it, expect } from 'vitest';
import { MerkleTree, generateMerkleRoot } from '../../app/api/stamp/_merkle';

describe('Merkle Tree', () => {
  describe('MerkleTree class', () => {
    it('should create a merkle tree from single element', () => {
      const data = ['insight1'];
      const tree = new MerkleTree(data);
      const root = tree.getRoot();
      
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
      expect(root.length).toBe(64); // SHA256 hex string
    });

    it('should create a merkle tree from multiple elements', () => {
      const data = ['insight1', 'insight2', 'insight3', 'insight4'];
      const tree = new MerkleTree(data);
      const root = tree.getRoot();
      
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
      expect(root.length).toBe(64);
    });

    it('should handle odd number of elements', () => {
      const data = ['insight1', 'insight2', 'insight3'];
      const tree = new MerkleTree(data);
      const root = tree.getRoot();
      
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
    });

    it('should generate consistent roots for same data', () => {
      const data = ['insight1', 'insight2'];
      const tree1 = new MerkleTree(data);
      const tree2 = new MerkleTree(data);
      
      expect(tree1.getRoot()).toBe(tree2.getRoot());
    });

    it('should generate different roots for different data', () => {
      const data1 = ['insight1', 'insight2'];
      const data2 = ['insight3', 'insight4'];
      const tree1 = new MerkleTree(data1);
      const tree2 = new MerkleTree(data2);
      
      expect(tree1.getRoot()).not.toBe(tree2.getRoot());
    });

    it('should generate proof for leaf', () => {
      const data = ['insight1', 'insight2', 'insight3', 'insight4'];
      const tree = new MerkleTree(data);
      const proof = tree.getProof(0);
      
      expect(Array.isArray(proof)).toBe(true);
      expect(proof.length).toBeGreaterThan(0);
    });

    it('should verify valid proof', () => {
      const data = ['insight1', 'insight2', 'insight3', 'insight4'];
      const tree = new MerkleTree(data);
      const root = tree.getRoot();
      const proof = tree.getProof(0);
      
      const isValid = MerkleTree.verify('insight1', proof, root);
      expect(isValid).toBe(true);
    });

    it('should reject invalid proof', () => {
      const data = ['insight1', 'insight2', 'insight3', 'insight4'];
      const tree = new MerkleTree(data);
      const root = tree.getRoot();
      const proof = tree.getProof(0);
      
      // Try to verify wrong leaf with valid proof
      const isValid = MerkleTree.verify('wronginsight', proof, root);
      expect(isValid).toBe(false);
    });

    it('should throw error for empty data', () => {
      expect(() => new MerkleTree([])).toThrow('Cannot build tree with no leaves');
    });

    it('should throw error for out of bounds index', () => {
      const data = ['insight1', 'insight2'];
      const tree = new MerkleTree(data);
      
      expect(() => tree.getProof(2)).toThrow('Index out of bounds');
    });
  });

  describe('generateMerkleRoot helper', () => {
    it('should generate root from insight IDs', () => {
      const insightIds = ['clx1', 'clx2', 'clx3'];
      const root = generateMerkleRoot(insightIds);
      
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
      expect(root.length).toBe(64);
    });

    it('should generate consistent roots', () => {
      const insightIds = ['clx1', 'clx2'];
      const root1 = generateMerkleRoot(insightIds);
      const root2 = generateMerkleRoot(insightIds);
      
      expect(root1).toBe(root2);
    });

    it('should throw error for empty array', () => {
      expect(() => generateMerkleRoot([])).toThrow('Cannot generate merkle root from empty array');
    });
  });
});
