<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\BonLivraison;
use App\Models\Fournisseur;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BonLivraisonTest extends TestCase
{
    use DatabaseTransactions;

    protected $user;
    protected $fournisseur;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user and authenticate via Sanctum
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);

        // Create a test fournisseur
        $this->fournisseur = Fournisseur::create([
            'raisonSociale' => 'Fournisseur Test SARL',
            'ice' => '123456789012345',
            'adresse' => '123 Rue de Test, Casablanca',
            'telephone' => '0522123456',
            'email' => 'test@fournisseur.com'
        ]);
    }

    public function test_can_list_bons_livraison(): void
    {
        // Create dummy BonLivraison
        BonLivraison::create([
            'numero_bl' => 'BL-TEST-LIST-01',
            'date_bl' => '2026-05-20',
            'fournisseur' => $this->fournisseur->raisonSociale,
            'fournisseur_id' => $this->fournisseur->id,
            'reference_bc' => 'BC-101, BC-102',
            'client' => 'Client Test',
            'total_ht' => 1000.00,
            'total_tva' => 200.00,
            'total_ttc' => 1200.00,
            'items' => [
                [
                    'price_number' => '1',
                    'service_description' => 'Produit A',
                    'unit_of_measure' => 'Sac',
                    'qty' => 10,
                    'unit_price_ht' => 100,
                    'vat_rate' => 20
                ]
            ],
            'statut' => 'En cours'
        ]);

        $response = $this->getJson('/api/bons-livraison');

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'numero_bl' => 'BL-TEST-LIST-01',
                     'fournisseur' => 'Fournisseur Test SARL'
                 ]);
    }

    public function test_can_create_bon_livraison_with_precalculated_totals(): void
    {
        $payload = [
            'numero_bl' => 'BL-TEST-STORE-02',
            'date_bl' => '2026-05-20',
            'fournisseur' => $this->fournisseur->raisonSociale,
            'fournisseur_id' => $this->fournisseur->id,
            'reference_bc' => 'BC-201',
            'client' => 'Client Test 2',
            'total_ht' => 500.00,
            'total_tva' => 100.00,
            'total_ttc' => 600.00,
            'items' => [
                [
                    'price_number' => '1',
                    'service_description' => 'Produit B',
                    'unit_of_measure' => 'Sac',
                    'qty' => 5,
                    'unit_price_ht' => 100,
                    'vat_rate' => 20
                ]
            ],
            'statut' => 'En cours'
        ];

        $response = $this->postJson('/api/bons-livraison', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('numero_bl', 'BL-TEST-STORE-02')
                 ->assertJsonPath('total_ht', 500);

        $this->assertDatabaseHas('bons_livraison', [
            'numero_bl' => 'BL-TEST-STORE-02',
            'total_ttc' => 600
        ]);
    }

    public function test_automatic_totals_fallback_when_omitted(): void
    {
        $payload = [
            'numero_bl' => 'BL-TEST-FALLBACK-03',
            'date_bl' => '2026-05-20',
            'fournisseur' => $this->fournisseur->raisonSociale,
            'fournisseur_id' => $this->fournisseur->id,
            'reference_bc' => 'BC-301',
            'client' => 'Client Test 3',
            // totals omitted on purpose to test server-side auto-calculation fallback
            'items' => [
                [
                    'price_number' => '1',
                    'service_description' => 'Produit C',
                    'unit_of_measure' => 'Sac',
                    'qty' => 10,
                    'unit_price_ht' => 150.00,
                    'vat_rate' => 20
                ]
            ],
            'statut' => 'En cours'
        ];

        $response = $this->postJson('/api/bons-livraison', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('total_ht', 1500)
                 ->assertJsonPath('total_tva', 300)
                 ->assertJsonPath('total_ttc', 1800);

        $this->assertDatabaseHas('bons_livraison', [
            'numero_bl' => 'BL-TEST-FALLBACK-03',
            'total_ht' => 1500.00,
            'total_ttc' => 1800.00
        ]);
    }

    public function test_can_update_bon_livraison(): void
    {
        $bl = BonLivraison::create([
            'numero_bl' => 'BL-TEST-UPDATE-04',
            'date_bl' => '2026-05-20',
            'fournisseur' => $this->fournisseur->raisonSociale,
            'fournisseur_id' => $this->fournisseur->id,
            'reference_bc' => 'BC-401',
            'client' => 'Client Test 4',
            'total_ht' => 100.00,
            'total_tva' => 20.00,
            'total_ttc' => 120.00,
            'items' => [],
            'statut' => 'En cours'
        ]);

        $payload = [
            'numero_bl' => 'BL-TEST-UPDATE-04',
            'date_bl' => '2026-05-20',
            'statut' => 'Validé'
        ];

        $response = $this->putJson("/api/bons-livraison/{$bl->id}", $payload);

        $response->assertStatus(200)
                 ->assertJsonPath('statut', 'Validé');

        $this->assertDatabaseHas('bons_livraison', [
            'id' => $bl->id,
            'statut' => 'Validé'
        ]);
    }

    public function test_can_delete_bon_livraison(): void
    {
        $bl = BonLivraison::create([
            'numero_bl' => 'BL-TEST-DELETE-05',
            'date_bl' => '2026-05-20',
            'fournisseur' => $this->fournisseur->raisonSociale,
            'fournisseur_id' => $this->fournisseur->id,
            'reference_bc' => 'BC-501',
            'items' => [],
            'statut' => 'En cours'
        ]);

        $response = $this->deleteJson("/api/bons-livraison/{$bl->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('bons_livraison', [
            'id' => $bl->id
        ]);
    }
}
