import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PackageStatus } from '../../database/entities/2_package.entity';
import { Destination } from '../../database/entities/3_destination.entity';

@Injectable()
export class DestinationService {
  constructor(private readonly dataSource: DataSource) {}

  async listActiveDestinations(): Promise<
    Array<{
      id: number;
      name: string;
      description: string;
      slug: string;
      hero_image: string | null;
      total_packages: number;
    }>
  > {
    const destinationRepo = this.dataSource.getRepository(Destination);

    const destinations = await destinationRepo
      .createQueryBuilder('destination')
      .where('destination.is_active = :isActive', { isActive: true })
      .orderBy('destination.sort_order', 'ASC')
      .loadRelationCountAndMap('destination.total_packages', 'destination.packages', 'pkg', (qb) =>
        qb.andWhere('pkg.status = :publishedStatus', { publishedStatus: PackageStatus.PUBLISHED }),
      )
      .getMany();

    return destinations.map((dest) => ({
      id: Number(dest.id),
      name: dest.name,
      description: dest.description,
      slug: dest.slug,
      hero_image: dest.hero_image ?? null,
      total_packages: Number(
        (dest as Destination & { total_packages?: number }).total_packages ?? 0,
      ),
    }));
  }
}
