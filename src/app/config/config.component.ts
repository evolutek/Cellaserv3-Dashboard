import {Component, OnInit} from '@angular/core';

import {CellaservService} from '../cellaserv.service';

class ConfigSectionEntry {
  name: string;
  value: string;
  currentValue: string;
}

class ConfigSection {
  name: string;
  entries: ConfigSectionEntry[];
}

class ConfigUpdate {
  value: string;
}

@Component({
  selector : 'app-config',
  templateUrl : './config.component.html',
  styleUrls : [ './config.component.scss' ]
})
export class ConfigComponent implements OnInit {
  config_sections: ConfigSection[] = [];
  config_update_map: {[pubName: string]: ConfigSectionEntry} = {};

  constructor(public cs: CellaservService) {}

  ngOnInit() {
    this.cs.request("config", "list")
        .subscribe(rep => this.resetConfig(rep), error => console.log(error));
    // Setup listener
    this.cs.subscribePattern<ConfigUpdate>('config.*')
        .subscribe(pub => this.config_update_map[pub.name].value =
                       pub.data.value);
  }

  resetConfig(config: any) {
    // Clear config array
    this.config_sections.length = 0;

    for (let key in config) {
      var entries = [];
      for (let option in config[key]) {
        let entry = {
          name : option,
          value : config[key][option],
          currentValue : config[key][option], // TODO(halfr): use constructor
        };
        // Save entry for dynamic updates
        this.config_update_map[`config.${key}.${option}`] = entry;
        entries.push(entry);
      }
      this.config_sections.push({name : key, entries : entries});
    }

    // Sort
    this.config_sections.sort((a, b) => a.name.localeCompare(b.name));
  }

  updateConfig(section: ConfigSection, entry: ConfigSectionEntry,
               value: string) {
    this.cs
        .request("config", "set",
                 {section : section.name, option : entry.name, value : value})
        .subscribe(_ => {}, error => console.log(error));
  }
}
