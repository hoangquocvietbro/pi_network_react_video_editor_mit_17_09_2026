import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getAuthCookie, verifyJWT } from '../../../lib/auth';
import { executeNeonQuery } from '../../../lib/database'; // Import hàm SQL Fetch mà chúng ta vừa tạo
import type { CreateProjectRequest, ProjectListItem } from '../../../lib/types'; // Nhớ trỏ về types.ts

// Helper function to get authenticated user (Stateless JWT)
async function getAuthenticatedUser() {
  try {
    const token = await getAuthCookie();
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) return null;

    // Không cần kiểm tra bảng sessions nữa vì chúng ta dùng Stateless JWT
    return payload.userId;
  } catch (error) {
    console.error("Auth Error in getAuthenticatedUser:", error);
    return null;
  }
}

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('public') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get authenticated user
    const authenticatedUserId = await getAuthenticatedUser();

    // Thuật toán xây dựng Query Động (Dynamic SQL) an toàn
    const params: any[] = [];
    const param = (val: any) => {
      params.push(val);
      return `$${params.length}`; // Tự động tạo $1, $2, $3...
    };

    let whereClauses: string[] = [];

    // If no userId specified, show user's own projects + public projects
    if (!userId) {
      if (authenticatedUserId) {
        whereClauses.push(`(user_id = ${param(authenticatedUserId)} OR is_public = true)`);
      } else {
        whereClauses.push(`is_public = true`);
      }
    } else {
      // Specific user requested
      if (userId === authenticatedUserId) {
        whereClauses.push(`user_id = ${param(userId)}`);
      } else {
        whereClauses.push(`user_id = ${param(userId)}`);
        whereClauses.push(`is_public = true`);
      }
    }

    // Filter by public if requested
    if (isPublic) {
      whereClauses.push(`is_public = true`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT id, name, description, thumbnail_url, created_at, updated_at, last_accessed_at, tags, is_public, user_id
      FROM projects
      ${whereString}
      ORDER BY updated_at DESC
      LIMIT ${param(limit)} OFFSET ${param(offset)};
    `;

    const projectsResult = await executeNeonQuery(query, params);

    // Transform to ProjectListItem format
    const projectListItems: ProjectListItem[] = projectsResult.rows.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      thumbnail_url: project.thumbnail_url,
      created_at: project.created_at,
      updated_at: project.updated_at,
      last_accessed_at: project.last_accessed_at,
      tags: project.tags || [],
      is_public: project.is_public
    }));

    return NextResponse.json(projectListItems);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticatedUserId = await getAuthenticatedUser();
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateProjectRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.design_data) {
      return NextResponse.json(
        { error: 'Name and design_data are required' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const projectId = nanoid();

    // JSON.stringify được dùng để đảm bảo dữ liệu object mảng tương thích chuẩn với cột JSONB của Postgres
    const designDataJson = JSON.stringify(body.design_data);
    const tagsArray = body.tags || [];

    // Create project
    const insertQuery = `
      INSERT INTO projects (
        id, name, description, thumbnail_url, design_data, user_id, is_public, tags, created_at, updated_at, last_accessed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW()
      ) RETURNING *;
    `;

    const insertParams = [
      projectId,
      body.name,
      body.description || null,
      null, // thumbnail_url ban đầu
      designDataJson,
      authenticatedUserId,
      body.is_public || false,
      tagsArray
    ];

    const insertResult = await executeNeonQuery(insertQuery, insertParams);
    let newProject = insertResult.rows[0];

    if (!newProject) {
      throw new Error('Failed to create project');
    }

    // Generate thumbnail
    const thumbnailUrl = await generateProjectThumbnail(projectId, body.design_data);

    // Update with thumbnail if success
    if (thumbnailUrl) {
      const updateQuery = `
        UPDATE projects 
        SET thumbnail_url = $1 
        WHERE id = $2 
        RETURNING *;
      `;
      const updateResult = await executeNeonQuery(updateQuery, [thumbnailUrl, projectId]);
      newProject = updateResult.rows[0];
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate project thumbnail
async function generateProjectThumbnail(projectId: string, designData: any): Promise<string | null> {
  try {
    // In a real implementation, you would:
    // 1. Render the first frame of the video
    // 2. Take a screenshot
    // 3. Upload to a storage service (AWS S3, etc.)
    // 4. Return the URL
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}
