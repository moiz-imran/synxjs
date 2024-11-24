import { FunctionalComponent } from '@synxjs/types';
import { useParams, useRouter } from '@synxjs/router';

interface ProductParams extends Record<string, string> {
  id: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  details: string[];
}

const PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Premium Widget',
    price: 99.99,
    description: 'A high-quality widget for all your needs',
    details: [
      'Made from premium materials',
      'Lifetime warranty',
      'Free shipping',
      'Money-back guarantee',
    ],
  },
  '2': {
    id: '2',
    name: 'Super Gadget',
    price: 149.99,
    description: 'The latest in gadget technology',
    details: [
      'Cutting-edge technology',
      '5-year warranty',
      'Free technical support',
      'Regular software updates',
    ],
  },
  '3': {
    id: '3',
    name: 'Mega Tool',
    price: 79.99,
    description: 'Professional-grade tool for experts',
    details: [
      'Industrial strength',
      '3-year warranty',
      'Professional support',
      'Training included',
    ],
  },
};

export const ProductDetail: FunctionalComponent = () => {
  const { id } = useParams<ProductParams>();
  const router = useRouter();
  const product = PRODUCTS[id];

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Product Not Found
        </h2>
        <button
          onClick={() => router.navigate('/products')}
          className="text-blue-500 hover:underline"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.navigate('/products')}
        className="text-blue-500 hover:underline mb-6 inline-block"
      >
        ← Back to Products
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
            {product.description}
          </p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8">
            ${product.price}
          </p>

          <div className="border-t dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Product Details</h2>
            <ul className="space-y-2">
              {product.details.map((detail, index) => (
                <li
                  key={index}
                  className="flex items-center text-gray-700 dark:text-gray-300"
                >
                  <span className="mr-2">•</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
