import { Demand, DemandAssignee, TeamMember } from '../types';

/**
 * Checks whether a given member is assigned to a demand
 * either as the primary assignee or as one of the additional assignees.
 */
export function isMemberAssignedToDemand(demand: Demand, memberId: string): boolean {
  if (!memberId) return false;
  if (demand.assignee_id === memberId) return true;
  return Boolean(demand.additional_assignees?.some(a => a.member_id === memberId));
}

/**
 * Returns the member's specific role in a demand (primary vs co-assignee + role description).
 */
export function getMemberRoleInDemand(
  demand: Demand, 
  memberId: string
): { isPrimary: boolean; roleDescription?: string } | null {
  if (!memberId) return null;
  if (demand.assignee_id === memberId) {
    return { isPrimary: true };
  }
  const additional = demand.additional_assignees?.find(a => a.member_id === memberId);
  if (additional) {
    return { isPrimary: false, roleDescription: additional.role_description };
  }
  return null;
}

export interface ResolvedDemandAssignee {
  member: TeamMember;
  isPrimary: boolean;
  roleDescription?: string;
}

/**
 * Resolves all assignees for a demand with their member details and role descriptions.
 */
export function getAllDemandAssignees(demand: Demand, members: TeamMember[]): ResolvedDemandAssignee[] {
  const memberMap = new Map(members.map(m => [m.id, m]));
  const results: ResolvedDemandAssignee[] = [];
  const visitedMemberIds = new Set<string>();

  // Primary assignee
  if (demand.assignee_id) {
    const primaryMember = memberMap.get(demand.assignee_id);
    if (primaryMember) {
      results.push({
        member: primaryMember,
        isPrimary: true,
      });
      visitedMemberIds.add(primaryMember.id);
    }
  }

  // Additional assignees
  if (demand.additional_assignees && Array.isArray(demand.additional_assignees)) {
    for (const add of demand.additional_assignees) {
      if (!add.member_id || visitedMemberIds.has(add.member_id)) continue;
      const member = memberMap.get(add.member_id);
      if (member) {
        results.push({
          member,
          isPrimary: false,
          roleDescription: add.role_description,
        });
        visitedMemberIds.add(member.id);
      }
    }
  }

  return results;
}
