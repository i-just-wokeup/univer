type DepartmentVisibilityUser = {
  department: string;
  department_public: boolean;
  id: string;
};

export function getVisibleDepartmentForViewer(
  user: DepartmentVisibilityUser,
  viewerUserId: string,
): string | null {
  if (user.id === viewerUserId || user.department_public) {
    return user.department;
  }

  return null;
}
