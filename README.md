<p align="center">
  <img src="docs/banner.svg" width="100%" alt="NovaEntra Backend banner" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1200&color=4338CA&center=true&vCenter=true&width=760&lines=Enterprise+ERP%2C+one+API;NestJS+%2B+PostgreSQL;Multi-tenant+by+design" alt="Typing tagline" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/languages/top/Skander-Bardaoui/PI-DEV-BACKEND?style=flat-square&color=4338CA" alt="" />
  <img src="https://img.shields.io/github/stars/Skander-Bardaoui/PI-DEV-BACKEND?style=flat-square&color=4338CA" alt="" />
  <img src="https://img.shields.io/github/last-commit/Skander-Bardaoui/PI-DEV-BACKEND?style=flat-square&color=6366F1" alt="" />
  <img src="https://img.shields.io/badge/status-Active-4338CA?style=flat-square" alt="" />
</p>

## Overview

The API behind the ERP platform: NestJS and PostgreSQL with JWT authentication, role-based access control, tenant isolation, sales and purchase workflows, inventory, treasury, reporting and AI-assisted features. Built to be containerised and deployed with Jenkins and Kubernetes.

## Highlights

- JWT authentication, RBAC and business-level tenant isolation
- Quotes, invoices, sales orders, delivery notes and recurring invoices
- Suppliers, purchase orders, goods receipts and three-way matching
- Inventory movements, warehouse management and product tracking
- Treasury, payments, reporting and scheduled jobs
- Docker, Jenkins pipelines and Kubernetes manifests included

## Tech stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nestjs,ts,nodejs,postgres,docker,kubernetes,jenkins,git&theme=dark&perline=8" alt="Tech stack" />
</p>

## Getting started

**Prerequisites:** Node.js 20+, PostgreSQL and a configured .env file.

```bash
npm install
cp .env.example .env
# configure DB_* and JWT secrets
npm run migration:run
npm run start:dev
```

## Project structure

```text
src/         modules, controllers, services and entities
migrations/  TypeORM migrations
test/        unit and e2e tests
k8s/         deployment manifests
```

## Documentation

- [Original project documentation](docs/README_ORIGINAL.md)

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:4338CA,100:0A0A0C&height=110&section=footer" alt="footer" width="100%" />
</p>

<p align="center">
  Built by <a href="https://github.com/Skander-Bardaoui"><b>Skander Bardaoui</b></a> ·
  <a href="https://skander-bardaoui.netlify.app/">Portfolio</a> ·
  <a href="https://github.com/Skander-Bardaoui?tab=repositories">All repositories</a>
</p>
