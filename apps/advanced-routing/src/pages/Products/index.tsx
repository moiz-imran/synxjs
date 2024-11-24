import { FunctionalComponent } from '@synxjs/types';
import { Link } from '@synxjs/router';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Widget',
    price: 99.99,
    description: 'A high-quality widget for all your needs',
  },
  {
    id: '2',
    name: 'Super Gadget',
    price: 149.99,
    description: 'The latest in gadget technology',
  },
  {
    id: '3',
    name: 'Mega Tool',
    price: 79.99,
    description: 'Professional-grade tool for experts',
  },
];

export const Products: FunctionalComponent = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <Link
            to={`/products/${product.id}`}
            key={product.id}
            className="block group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {product.description}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${product.price}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
