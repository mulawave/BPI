/**
 * Profile Completion Checker
 * Validates that all required user profile fields are complete
 */

interface UserProfile {
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  gender?: string | null;
  image?: string | null;
}

interface ProfileCompletionResult {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  requiredFieldsCount: number;
  completedFieldsCount: number;
}

const REQUIRED_FIELDS = [
  { key: 'firstname', label: 'First Name' },
  { key: 'lastname', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'gender', label: 'Gender' },
  { key: 'image', label: 'Profile Picture' },
] as const;

/**
 * Check if a field value is considered "complete"
 */
function isFieldComplete(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed.toLowerCase() !== 'not set';
  }
  return false;
}

/**
 * Calculate profile completion status
 */
export function checkProfileCompletion(profile: UserProfile): ProfileCompletionResult {
  const missingFields: string[] = [];
  let completedCount = 0;

  REQUIRED_FIELDS.forEach(({ key, label }) => {
    const value = profile[key as keyof UserProfile];
    if (isFieldComplete(value)) {
      completedCount++;
    } else {
      missingFields.push(label);
    }
  });

  const totalFields = REQUIRED_FIELDS.length;
  const completionPercentage = Math.round((completedCount / totalFields) * 100);
  const isComplete = completedCount === totalFields;

  return {
    isComplete,
    completionPercentage,
    missingFields,
    requiredFieldsCount: totalFields,
    completedFieldsCount: completedCount,
  };
}

/**
 * Get a user-friendly message about profile completion
 */
export function getCompletionMessage(result: ProfileCompletionResult): string {
  if (result.isComplete) {
    return "✅ Your profile is 100% complete!";
  }

  const remaining = result.requiredFieldsCount - result.completedFieldsCount;
  if (remaining === 1) {
    return `Almost there! Just ${remaining} field left: ${result.missingFields[0]}`;
  }

  return `Please complete ${remaining} more fields to unlock your dashboard`;
}
