import { NextRequest, NextResponse } from 'next/server';
import { executeNeonQuery } from '../../../../../lib/database';

// POST /api/projects/[id]/access - Mark project as accessed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update last_accessed_at timestamp bằng SQL Thuần
    const query = `
      UPDATE projects 
      SET last_accessed_at = NOW() 
      WHERE id = $1 
      RETURNING *;
    `;

    const result = await executeNeonQuery(query, [id]);
    const updatedProject = result.rows[0];

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project access:', error);
    return NextResponse.json(
      { error: 'Failed to update project access' },
      { status: 500 }
    );
  }
}
