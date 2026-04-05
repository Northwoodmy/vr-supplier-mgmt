import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        teamMembers: true,
        capacity: true,
        projects: {
          include: {
            project: true,
          },
        },
        qualityReviews: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Failed to fetch supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      level,
      techStack,
      description,
      status,
    } = body;

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 更新供应商信息
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name ?? existingSupplier.name,
        contactPerson: contactPerson ?? existingSupplier.contactPerson,
        contactEmail: contactEmail ?? existingSupplier.contactEmail,
        contactPhone: contactPhone ?? existingSupplier.contactPhone,
        address: address ?? existingSupplier.address,
        level: level ?? existingSupplier.level,
        techStack: techStack ?? existingSupplier.techStack,
        description: description ?? existingSupplier.description,
        status: status ?? existingSupplier.status,
      },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Failed to update supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的项目
    if (supplier.projects.length > 0) {
      return NextResponse.json(
        { error: '该供应商已关联项目，无法删除' },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
