<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DailyMenu;

class DailyMenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DailyMenu::truncate();

        $menus = [
            [
                'jour' => 'Lundi',
                'petit_dejeuner' => "Café au lait\n1 Beurre ou 1 fromage\n1 Confiture\n1 Pain",
                'dejeuner' => "Salade italienne\nViande de bœuf sans Os aux pruneaux secs + lentilles\nFruit de saison\n1.5 Pain",
                'diner' => "Emincés de dinde à la sauce\nRiz à la vapeur aux légumes\n1/2 Pain",
                'residents' => 450,
                'kcal_pd' => 610,
                'kcal_dej' => 840,
                'kcal_din' => 560,
            ],
            [
                'jour' => 'Mardi',
                'petit_dejeuner' => "Thé à la menthe ou Tkhalte\n1 Beurre ou 1 fromage\n1 Confiture\n1 Pain",
                'dejeuner' => "Salade betterave\nLégumes à la sauce\nPoulets aux olives\nFruit de saison\n01 Pain",
                'diner' => "Soupe Harira\n1 Œuf dur + 1 fromage + 01 pain + thé\nPate spaghetti bolognaise",
                'residents' => 450,
                'kcal_pd' => 590,
                'kcal_dej' => 810,
                'kcal_din' => 620,
            ],
            [
                'jour' => 'Mercredi',
                'petit_dejeuner' => "Café au lait\n1 Beurre ou 1 fromage\n1 Confiture\n1 Pain",
                'dejeuner' => "Salade zaalouk\nPoisson au four + Haricot secs à la sauce tomate au persil\nFruit de saison OU jus de citron au pomme\n1.5 Pain",
                'diner' => "Pate spaghetti bolognaise\nSemoule d'orge au lait\n1 Pain",
                'residents' => 450,
                'kcal_pd' => 610,
                'kcal_dej' => 850,
                'kcal_din' => 570,
            ],
            [
                'jour' => 'Jeudi',
                'petit_dejeuner' => "Thé à la menthe ou Tkhalte\n1 Beurre ou 1 fromage\n1 Confiture\n1 Pain",
                'dejeuner' => "Salade marocaine\nFilet de dinde + légumes à la sauce\nFruit de saison\n01 pain",
                'diner' => "Sandwich au thon, tomate, carotte, oignon, riz et salade verte avec mayonnaise\n1 Jus 25cl ou jus naturel ou Yaourt 110g",
                'residents' => 450,
                'kcal_pd' => 590,
                'kcal_dej' => 790,
                'kcal_din' => 640,
            ],
            [
                'jour' => 'Vendredi',
                'petit_dejeuner' => "Café au lait\n1 Beurre ou 1 fromage\n1 Confiture\n1 Pain",
                'dejeuner' => "Couscous aux légumes OU aux pois chiche et raisins secs (Tfaya)\nPoulet aux olives\n0.5L Petit Lait par deux\n1/2 Pain",
                'diner' => "Soupe Harira\nPate au thon ou à la sauce tomate\n1 Pain",
                'residents' => 450,
                'kcal_pd' => 610,
                'kcal_dej' => 890,
                'kcal_din' => 580,
            ],
            [
                'jour' => 'Samedi',
                'petit_dejeuner' => "Thé à la menthe ou Tkhalte\n1 Beurre ou 1 fromage\n1 Confiture\n1 Pain",
                'dejeuner' => "Salade mexicaine\nOsso Bucco de dinde aux légumes\nFruit de saison\n01 Pain",
                'diner' => "Boulette de viande hachée à la sauce tomate\nSoupe semoule fine au lait",
                'residents' => 450,
                'kcal_pd' => 590,
                'kcal_dej' => 820,
                'kcal_din' => 590,
            ],
            [
                'jour' => 'Dimanche',
                'petit_dejeuner' => "Ftour habituel (Café au lait + Pain + Beurre/Fromage)",
                'dejeuner' => "Yaourt 110g ou Fruit + 1 Fromage + 2 Œufs durs + 1 Pain",
                'diner' => "1 Filet maquereaux à l'huile 125g\nFruits de saison\n01 Pain",
                'residents' => 450,
                'kcal_pd' => 580,
                'kcal_dej' => 720,
                'kcal_din' => 610,
            ],
        ];

        foreach ($menus as $menu) {
            DailyMenu::create($menu);
        }
    }
}
