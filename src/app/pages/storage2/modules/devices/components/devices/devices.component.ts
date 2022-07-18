import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { EMPTY } from 'rxjs';
import {
  pluck, catchError, switchMap, tap,
} from 'rxjs/operators';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit {
  topology: PoolTopology;
  selectedItem: VDev;
  selectedParentItem: VDev | undefined;
  dataSource: IxNestedTreeDataSource<VDev>;
  poolId: number;
  treeControl = new NestedTreeControl<VDev, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });
  diskDictionary: { [key: string]: Disk } = {};

  readonly hasNestedChild = (_: number, vdev: VDev): boolean => Boolean(vdev.children?.length);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService, // TODO: Replace with a better approach
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
  ) { }

  get isDiskSelected(): boolean {
    return this.selectedItem.type === VDevType.Disk;
  }

  ngOnInit(): void {
    this.loadTopologyAndDisks();

    this.devicesStore.onReloadList
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadTopologyAndDisks());

    this.route.params.pipe(
      pluck('guid'),
      untilDestroyed(this),
    ).subscribe((guid) => {
      this.listenForRouteChanges(guid);
    });
  }

  private createDataSource(disks: VDev[]): void {
    this.dataSource = new IxNestedTreeDataSource(disks);
    this.dataSource.filterPredicate = (disks, query = '') => {
      return disks.map((disk) => {
        return findInTree([disk], (vdev) => {
          switch (vdev.type) {
            case VDevType.Disk:
              return vdev.disk.toLowerCase().includes(query.toLowerCase());
            case VDevType.Mirror:
              return vdev.name.toLowerCase().includes(query.toLowerCase());
          }
        });
      }).filter(Boolean);
    };
  }

  private selectFirstNode(): void {
    if (!this.treeControl?.dataNodes?.length) {
      return;
    }

    const disk = this.treeControl.dataNodes[0];
    this.treeControl.expand(disk);
    this.selectedItem = disk;
    this.selectedParentItem = undefined;
  }

  private listenForRouteChanges(id: string): void {
    if (id && this.dataSource?.data) {
      const traverseTree = (children: VDev[], parent?: VDev): { item: VDev; parent: VDev } => {
        for (const item of children) {
          if (item.guid !== id && item.children?.length) {
            const dataDisk = traverseTree(item.children, item);
            if (dataDisk) { return dataDisk; }
          }
          if (item.guid === id) {
            return { item, parent };
          }
        }
        return { item: undefined, parent: undefined };
      };

      this.selectedItem = traverseTree(this.dataSource.data).item;
      this.selectedParentItem = traverseTree(this.dataSource.data).parent;
    }
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  private loadTopologyAndDisks(): void {
    this.loader.open();
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    this.ws.call('pool.query', [[['id', '=', this.poolId]]]).pipe(
      switchMap((pools) => {
        // TODO: Handle pool not found.
        return this.ws.call('disk.query', [[['pool', '=', pools[0].name]], { extra: { pools: true } }]).pipe(
          tap((disks) => {
            this.diskDictionary = _.keyBy(disks, (disk) => disk.devname);
            this.topology = pools[0].topology;
            this.treeControl.dataNodes = this.topology.data;
            this.createDataSource(this.topology.data);
            this.selectFirstNode();
            this.loader.close();

            const routeDatasetId = this.route.snapshot.paramMap.get('guid');
            this.listenForRouteChanges(routeDatasetId);
            this.cdr.markForCheck();
          }),
        );
      }),
      catchError(() => {
        // TODO: Handle error.
        return EMPTY;
      }),
      untilDestroyed(this),
    )
      .subscribe();
  }
}
