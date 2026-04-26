import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { Navbar } from './core/components/navbar/navbar.component';
import { Loader } from './shared/components/loader/loader.component';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  declarations: [App, Navbar, Loader],
  imports: [BrowserModule, BrowserAnimationsModule, AppRoutingModule, CoreModule, SharedModule],
  providers: [provideBrowserGlobalErrorListeners(), provideCharts(withDefaultRegisterables())],
  bootstrap: [App],
})
export class AppModule {}
