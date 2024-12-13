import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract state
const contractState = {
  userReputation: new Map(),
  projectReviews: new Map(),
};

// Mock contract call function
const mockContractCall = vi.fn((functionName: string, args: any[], sender: string) => {
  if (functionName === 'submit-review') {
    const [projectId, reviewee, score, comment] = args;
    const projectReview = contractState.projectReviews.get(projectId) || { clientReview: null, freelancerReview: null };
    const userRep = contractState.userReputation.get(reviewee) || { totalScore: 0, reviewCount: 0 };
    
    if (!projectReview.clientReview) {
      projectReview.clientReview = { reviewer: sender, reviewee, score, comment };
    } else {
      projectReview.freelancerReview = { reviewer: sender, reviewee, score, comment };
    }
    
    contractState.projectReviews.set(projectId, projectReview);
    contractState.userReputation.set(reviewee, {
      totalScore: userRep.totalScore + score,
      reviewCount: userRep.reviewCount + 1,
    });
    
    return { success: true };
  }
  if (functionName === 'get-user-reputation') {
    const [user] = args;
    const reputation = contractState.userReputation.get(user);
    return reputation ? { success: true, value: reputation } : { success: false, error: 'Not found' };
  }
  if (functionName === 'get-project-reviews') {
    const [projectId] = args;
    const reviews = contractState.projectReviews.get(projectId);
    return reviews ? { success: true, value: reviews } : { success: false, error: 'Not found' };
  }
  return { success: false, error: 'Function not found' };
});

describe('Reputation System Contract', () => {
  const client = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const freelancer = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
  
  beforeEach(() => {
    contractState.userReputation.clear();
    contractState.projectReviews.clear();
    mockContractCall.mockClear();
  });
  
  it('should submit a review', () => {
    const result = mockContractCall('submit-review', [1, freelancer, 5, 'Great work!'], client);
    expect(result).toEqual({ success: true });
    expect(contractState.projectReviews.get(1)).toBeDefined();
    expect(contractState.userReputation.get(freelancer)).toBeDefined();
  });
  
  it('should get user reputation', () => {
    mockContractCall('submit-review', [1, freelancer, 5, 'Great work!'], client);
    mockContractCall('submit-review', [2, freelancer, 4, 'Good job!'], client);
    const result = mockContractCall('get-user-reputation', [freelancer], client);
    expect(result).toEqual({
      success: true,
      value: {
        totalScore: 9,
        reviewCount: 2,
      },
    });
  });
  
  it('should get project reviews', () => {
    mockContractCall('submit-review', [1, freelancer, 5, 'Great work!'], client);
    mockContractCall('submit-review', [1, client, 4, 'Good client!'], freelancer);
    const result = mockContractCall('get-project-reviews', [1], client);
    expect(result).toEqual({
      success: true,
      value: {
        clientReview: {
          reviewer: client,
          reviewee: freelancer,
          score: 5,
          comment: 'Great work!',
        },
        freelancerReview: {
          reviewer: freelancer,
          reviewee: client,
          score: 4,
          comment: 'Good client!',
        },
      },
    });
  });
  
  it('should not allow score outside of -5 to 5 range', () => {
    const result = mockContractCall('submit-review', [1, freelancer, 10, 'Invalid score'], client);
    expect(result).toEqual({ success: false, error: 'Invalid score' });
  });
  
  it('should not allow multiple reviews from the same user for a project', () => {
    mockContractCall('submit-review', [1, freelancer, 5, 'Great work!'], client);
    const result = mockContractCall('submit-review', [1, freelancer, 4, 'Another review'], client);
    expect(result).toEqual({ success: false, error: 'Review already submitted' });
  });
});
