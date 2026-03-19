import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationData } from '@rwanda360/rwanda360-service-sdk';

export const paginationDataFactory = (data: unknown, context: ExecutionContext): PaginationData => {
  const request = context.switchToHttp().getRequest();

  const page = Math.max(parseInt(request.query.page) || 1);
  const perPage = Math.max(parseInt(request.query.perPage) || 10);

  const offset = (page - 1) * perPage;

  return {
    currentPage: page,
    skip: offset,
    take: perPage,
    query: request.query.query,
  };
};

export const GetPaginationData = createParamDecorator(paginationDataFactory);
