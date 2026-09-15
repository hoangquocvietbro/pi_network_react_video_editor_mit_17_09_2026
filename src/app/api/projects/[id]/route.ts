import { NextRequest, NextResponse } from 'next/server';
import { executeNeonQuery } from '../../../../lib/database';
import { getAuthCookie, verifyJWT } from '../../../../lib/auth';
import type { UpdateProjectRequest } from '../../../../lib/types';

// Helper function to get authenticated user (Stateless JWT)
async function getAuthenticatedUser() {
  try {
    const token = await getAuthCookie();
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) return null;

    return payload.userId;
  } catch (error) {
    console.error("Auth Error in getAuthenticatedUser:", error);
    return null;
  }
}

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authenticatedUserId = await getAuthenticatedUser();

    const query = `
      SELECT * FROM projects 
      WHERE id = $1 
      LIMIT 1;
    `;
    const result = await executeNeonQuery(query, [id]);
    const project = result.rows[0];

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Nếu project không công khai và người xem không phải chủ sở hữu
    if (!project.is_public && project.user_id !== authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized access to private project' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authenticatedUserId = await getAuthenticatedUser();
    
    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: UpdateProjectRequest = await request.json();

    // 1. Check if project exists and verify ownership
    const checkQuery = `SELECT user_id FROM projects WHERE id = $1 LIMIT 1;`;
    const checkResult = await executeNeonQuery(checkQuery, [id]);
    const existingProject = checkResult.rows[0];

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.user_id !== authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    // 2. Prepare dynamic update data
    const queryParams: any[] = [id];
    const setClauses: string[] = ['updated_at = NOW()'];

    const addParam = (columnName: string, value: any) => {
      queryParams.push(value);
      setClauses.push(`${columnName} = $${queryParams.length}`);
    };

    if (body.name !== undefined) addParam('name', body.name);
    if (body.description !== undefined) addParam('description', body.description);
    if (body.is_public !== undefined) addParam('is_public', body.is_public);
    if (body.design_data !== undefined) addParam('design_data', JSON.stringify(body.design_data));
    if (body.tags !== undefined) addParam('tags', body.tags);

    // 3. Execute dynamic update
    const updateQuery = `
      UPDATE projects 
      SET ${setClauses.join(', ')} 
      WHERE id = $1 
      RETURNING *;
    `;
    const updatedResult = await executeNeonQuery(updateQuery, queryParams);
    const updatedProject = updatedResult.rows[0];

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authenticatedUserId = await getAuthenticatedUser();

    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 1. Check if project exists and verify ownership
    const checkQuery = `SELECT user_id FROM projects WHERE id = $1 LIMIT 1;`;
    const checkResult = await executeNeonQuery(checkQuery, [id]);
    const project = checkResult.rows[0];

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    // 2. Delete project
    const deleteQuery = `DELETE FROM projects WHERE id = $1;`;
    await executeNeonQuery(deleteQuery, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
