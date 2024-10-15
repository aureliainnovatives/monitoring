from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the pre-trained Sentence Transformer model
#model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
#model = SentenceTransformer('all-mpnet-base-v2')
#model = SentenceTransformer('sentence-transformers/paraphrase-mpnet-base-v2')
model = SentenceTransformer('sentence-transformers/all-roberta-large-v1')


@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'Sentence Transformer service is running'})


@app.route('/embed', methods=['POST'])
def embed_sentence():
    data = request.get_json()
    sentence = data.get('sentence')

    # Generate embedding for the sentence
    embedding = model.encode(sentence).tolist()
    return jsonify({'embedding': embedding})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002)
